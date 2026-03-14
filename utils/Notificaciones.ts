import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuración global: le dice al celular cómo mostrar la alerta
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Pedir permiso al usuario (necesario en Android 13+ y iOS)
export async function solicitarPermisosNotificaciones() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Alertas de Estudio',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#5E5CE6',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

// Función maestra: Recibe tus datos y programa todo mágicamente
export async function sincronizarNotificaciones(bloquesHorario: any[], eventosGlobales: any[]) {
    // 1. Borramos todas las notificaciones viejas para no crear duplicados
    await Notifications.cancelAllScheduledNotificationsAsync();

    const MAPA_DIAS: Record<string, number> = { 'Dom': 1, 'Lun': 2, 'Mar': 3, 'Mié': 4, 'Jue': 5, 'Vie': 6, 'Sáb': 7 };

    // 2. PROGRAMAR CLASES (Se repiten cada semana)
    if (bloquesHorario && bloquesHorario.length > 0) {
        for (const clase of bloquesHorario) {
            if (!clase.horaInicio || !clase.dia || clase.isActividad) continue;

            const [h, m] = clase.horaInicio.split(':');
            const dateTemp = new Date();
            dateTemp.setHours(parseInt(h), parseInt(m), 0, 0);

            // Restar 20 minutos
            const dateAlerta = new Date(dateTemp.getTime() - 20 * 60000);

            let dayIndex = MAPA_DIAS[clase.dia];
            // Ajuste mágico: Si la clase es a las 00:10, la alerta es el día anterior a las 23:50
            if (parseInt(h) < dateAlerta.getHours()) {
                dayIndex = dayIndex - 1;
                if (dayIndex < 1) dayIndex = 7;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '📚 ¡Clase en 20 minutos!',
                    body: `Tu clase de ${clase.ramo} está por comenzar${clase.aula && clase.aula !== 'Por definir' ? ` en la sala ${clase.aula}` : ''}.`,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                    weekday: dayIndex,
                    hour: dateAlerta.getHours(),
                    minute: dateAlerta.getMinutes(),
                },
            });
        }
    }

    // 3. PROGRAMAR EVENTOS (Fecha única)
    if (eventosGlobales && eventosGlobales.length > 0) {
        for (const evento of eventosGlobales) {
            if (!evento.fecha || !evento.hora) continue;

            try {
                const [dia, mes, ano] = evento.fecha.split('/');
                // Extraemos la hora (ya sea de un rango "08:00 - 10:00" o un límite "Hasta 12:00")
                const horaStr = evento.hora.includes('-') ? evento.hora.split(' - ')[0] : evento.hora.replace('Hasta ', '').trim();
                const [h, m] = horaStr.split(':');

                const fechaEvento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), parseInt(h), parseInt(m), 0);
                const fechaAlerta = new Date(fechaEvento.getTime() - 20 * 60000); // 20 mins antes

                // Solo programar si el evento es en el futuro
                if (fechaAlerta > new Date()) {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: '⚠️ ¡Evento Próximo!',
                            body: `Faltan 20 minutos para: ${evento.titulo}.`,
                            sound: true,
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DATE,
                            date: fechaAlerta, // Fecha exacta
                        },
                    });
                }
            } catch (e) {
                // Ignoramos si el evento tiene un formato de fecha viejo/inválido
            }
        }
    }
}