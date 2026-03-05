const services = [
    {
        id: 1,
        icon: '❓',
        title: 'Frequently Asked Questions',
        description: 'Updates on safe Shopping in our Stores',
        detailedInfo: 'Get instant support for order tracking, account recovery, and our 30-day no-questions-asked return policy.',
        color: '#EFF6FF',
    },
    {
        id: 2,
        icon: '💳',
        title: 'Online Payment Process',
        description: 'Updates on safe Shopping in our Stores',
        detailedInfo: 'We support encrypted transactions via UPI, All Major Cards, Net Banking, and digital wallets for a 100% secure checkout.',
        color: '#F0FDF4',
    },
    {
        id: 3,
        icon: '🚚',
        title: 'Home Delivery Options',
        description: 'Updates on safe Shopping in our Stores',
        detailedInfo: 'Track your package in real-time. Choose between Standard (3-5 days), Express (Next Day), or local Curbside Pickup.',
        color: '#FEF3C7',
    },
];

function Services() {
    return (
        <section className="services-section" id="services">
            <div className="section-container">
                <div className="section-header">
                    <h2 className="section-title">Services To Help You Shop</h2>
                </div>
                <div className="services-grid">
                    {services.map((service) => (
                        <div className="service-card" key={service.id} id={`service-${service.id}`}>
                            <div className="card-inner">
                                <div className="card-front">
                                    <div className="service-icon" style={{ backgroundColor: service.color }}>
                                        <span>{service.icon}</span>
                                    </div>
                                    <h3 className="service-title">{service.title}</h3>
                                    <p className="service-description">{service.description}</p>
                                    <span className="service-arrow">→</span>
                                </div>
                                <div className="card-back" style={{ backgroundColor: service.color }}>
                                    <div className="service-icon-small">
                                        <span>{service.icon}</span>
                                    </div>
                                    <p className="service-detailed-info">{service.detailedInfo}</p>
                                    <a href="#" className="service-learn-more">Learn More</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Services;
