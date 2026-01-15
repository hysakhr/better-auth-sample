use axum::{extract::Extension, routing::get, Json, Router};
use serde::Serialize;

use crate::middleware::AuthExtension;
use crate::AppState;

#[derive(Serialize)]
struct MeResponse {
    id: String,
    name: String,
    email: String,
    email_verified: bool,
    image: Option<String>,
}

/// 認証済みユーザー情報を返す
async fn me(Extension(auth): Extension<AuthExtension>) -> Json<MeResponse> {
    let user = auth.0;
    Json(MeResponse {
        id: user.id,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
        image: user.image,
    })
}

pub fn routes() -> Router<AppState> {
    Router::new().route("/me", get(me))
}
