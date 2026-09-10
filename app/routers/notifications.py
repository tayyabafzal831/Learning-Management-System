from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Notification
from app.dependencies import require_admin


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    notifications = db.query(Notification).order_by(
        Notification.id.desc()
    ).all()

    return notifications
