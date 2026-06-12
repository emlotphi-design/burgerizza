export default function NewContentShell({ children }) {
    return (
        <section className="newadm-content-shell">
            <div className="newadm-hero-panel">
                <div className="newadm-hero-copy">
                    <div className="newadm-hero-eyebrow">Premium fast-food operations</div>
                    <h1 className="newadm-hero-heading">
                        Elegant control for the modern kitchen.
                    </h1>
                    <p className="newadm-hero-text">
                        This foundation is a visual shell only. It is intentionally separated from the existing dashboard
                        implementation and will host the future BURGERIZZA management experience.
                    </p>
                </div>
                <div className="newadm-hero-aside">
                    <div className="newadm-hero-stat">
                        <span>Warm tone</span>
                        <strong>Cream + gold</strong>
                    </div>
                    <div className="newadm-hero-stat">
                        <span>Layout</span>
                        <strong>Floating panels</strong>
                    </div>
                    <div className="newadm-hero-stat">
                        <span>Aesthetic</span>
                        <strong>Luxury fast-food</strong>
                    </div>
                </div>
            </div>

            <div className="newadm-content-area">
                {children}
            </div>
        </section>
    );
}
