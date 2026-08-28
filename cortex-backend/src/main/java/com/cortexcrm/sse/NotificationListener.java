package com.cortexcrm.sse;

import com.cortexcrm.sse.events.ActivityLoggedEvent;
import com.cortexcrm.sse.events.ContactAssignedEvent;
import com.cortexcrm.sse.events.DealStageChangedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final SseEmitterRegistry registry;

    @EventListener
    public void onDealStageChanged(DealStageChangedEvent ev) {
        if (ev.recipientUserId() == null) return;
        registry.send(ev.recipientUserId(), "deal.stage.changed", ev);
    }

    @EventListener
    public void onActivityLogged(ActivityLoggedEvent ev) {
        if (ev.recipientUserId() == null) return;
        registry.send(ev.recipientUserId(), "activity.logged", ev);
    }

    @EventListener
    public void onContactAssigned(ContactAssignedEvent ev) {
        if (ev.recipientUserId() == null) return;
        registry.send(ev.recipientUserId(), "contact.assigned", ev);
    }
}
