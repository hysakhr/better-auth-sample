use axum::{middleware, Router};

use crate::middleware::auth_middleware;
use crate::AppState;

mod protected;
mod public;

pub fn public_routes() -> Router<AppState> {
    public::routes()
}

pub fn protected_routes() -> Router<AppState> {
    protected::routes()
}

pub fn routes(state: AppState) -> Router<AppState> {
    // 公開 API（認証不要）
    let public = public_routes();

    // 保護された API（認証必須）
    let protected =
        protected_routes().layer(middleware::from_fn_with_state(state.clone(), auth_middleware));

    Router::new().merge(public).merge(protected)
}
