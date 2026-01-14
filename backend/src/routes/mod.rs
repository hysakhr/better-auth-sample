use axum::Router;

use crate::AppState;

mod public;

pub fn routes() -> Router<AppState> {
    Router::new().merge(public::routes())
}
