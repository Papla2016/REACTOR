from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.db import get_db
from app import models
from app.auth import create_access_token, create_refresh_token
from app.core.config import get_settings

router = APIRouter(prefix="/oauth", tags=["oauth"])


@router.get("/{provider}/start")
def oauth_start(provider: str, role: str, request: Request):
    redirect_url = request.url_for("oauth_mock")
    return RedirectResponse(f"{redirect_url}?provider={provider}&role={role}")


@router.get("/mock", response_class=HTMLResponse, name="oauth_mock")
def oauth_mock(provider: str, role: str):
    html = f"""
    <html>
      <head>
        <title>Mock OAuth</title>
        <style>
          body {{ font-family: Arial, sans-serif; background: #f6f8fa; }}
          .card {{ max-width: 360px; margin: 40px auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
          input {{ width: 100%; padding: 10px; margin-top: 8px; margin-bottom: 16px; border: 1px solid #d0d7de; border-radius: 6px; }}
          button {{ width: 100%; background: #2da44e; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; }}
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Mock {provider.title()} Sign in</h2>
          <form action="/oauth/{provider}/callback" method="get">
            <input type="hidden" name="role" value="{role}" />
            <label>Email</label>
            <input name="email" placeholder="user@example.com" required />
            <label>Subject</label>
            <input name="subject" placeholder="{provider}-user-123" required />
            <button type="submit">Sign in</button>
          </form>
        </div>
      </body>
    </html>
    """
    return HTMLResponse(content=html)


@router.get("/{provider}/callback")
def oauth_callback(provider: str, email: str, subject: str, role: str, db: Session = Depends(get_db)):
    if role not in {"PATIENT", "DOCTOR"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = (
        db.query(models.User)
        .filter(models.User.oauth_provider == provider, models.User.oauth_subject == subject)
        .first()
    )
    if not user:
        user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            email=email,
            password_hash=None,
            role=models.UserRole(role),
            full_name=email.split("@")[0],
            oauth_provider=provider,
            oauth_subject=subject,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    settings = get_settings()
    access = create_access_token(user)
    refresh = create_refresh_token(user)
    redirect_url = f"{settings.frontend_url}/oauth/callback?access={access}&refresh={refresh}"
    return RedirectResponse(redirect_url)
