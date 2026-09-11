import logging

logger = logging.getLogger("acapra.security")


def get_client_ip(request) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "desconhecido")


def log_security_event(event_type: str, user, request) -> None:
    logger.info(
        "%s | user_id=%s email=%s ip=%s",
        event_type,
        user.pk,
        user.email,
        get_client_ip(request),
    )
