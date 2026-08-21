"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="shell"><h1>Щось пішло не так</h1><p className="muted">Спробуйте ще раз або поверніться до каталогу.</p><button className="button primary" onClick={reset}>Спробувати ще раз</button></main>; }
