import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale,
    ShieldCheck,
    FileText,
    Truck,
    RefreshCcw,
    XCircle,
    Wallet,
    HelpCircle,
    FileCheck,
    ChevronRight,
} from 'lucide-react';

const POLICY_TABS = [
    { id: 'terms', label: 'Terms & Conditions', icon: Scale },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'kyc', label: 'KYC Policy', icon: FileCheck },
    { id: 'shipping', label: 'Shipping Policy', icon: Truck },
    { id: 'returns', label: 'Refund & Return Policy', icon: RefreshCcw },
    { id: 'cancellation', label: 'Order Cancellation', icon: XCircle },
    { id: 'withdrawal', label: 'Withdrawal Policy', icon: Wallet },
    { id: 'grievance', label: 'Grievance Redressal', icon: HelpCircle },
    { id: 'product', label: 'Product Description', icon: FileText },
];

export default function Terms() {
    const [activeTab, setActiveTab] = useState('terms');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 font-sans md:py-12">
            <div className="mb-8 text-center md:mb-12">
                <h1 className="text-3xl font-extrabold text-slate-900 md:text-5xl">
                    Legal & <span className="text-primary">Policies</span>
                </h1>
                <p className="mt-4 text-sm font-medium text-slate-500 md:text-base">
                    Everything you need to know about using [Your Platform Name].
                </p>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                {}
                <aside className="sticky top-24 w-full shrink-0 lg:w-72">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Documentation
                            </h3>
                        </div>
                        <nav className="flex flex-col p-2">
                            {POLICY_TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold transition-all ${
                                            isActive
                                                ? 'bg-primary text-white shadow-md'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <Icon
                                                size={18}
                                                className={
                                                    isActive ? 'text-primary-100' : 'text-slate-400'
                                                }
                                            />
                                            {tab.label}
                                        </span>
                                        {isActive && <ChevronRight size={16} />}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {}
                <main className="w-full flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="policy-content space-y-6 text-slate-600"
                        >
                            {renderContent(activeTab)}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

function renderContent(tabId) {
    switch (tabId) {
        case 'terms':
            return (
                <div className="space-y-6">
                    <h2 className="mb-6 text-2xl font-extrabold text-slate-900">
                        Terms & Conditions
                    </h2>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Introduction</h3>
                        <p className="mb-4">
                            Welcome to <strong>[Your Platform Name]</strong> (“Company”, “we”,
                            “our”, “us”)!
                        </p>
                        <p className="mb-4">
                            These Terms of Service (“Terms”, “Terms of Service”) govern your use of
                            our website located at <strong>[yourdomain.com]</strong> (together or
                            individually “Service”) operated by{' '}
                            <strong>[YOUR COMPANY LEGAL NAME]</strong>.
                        </p>
                        <p className="mb-4">
                            Our Privacy Policy also governs your use of our Service and explains how
                            we collect, safeguard and disclose information that results from your
                            use of our web pages. Your agreement with us includes these Terms and
                            our Privacy Policy (“Agreements”). You acknowledge that you have read
                            and understood Agreements, and agree to be bound of them.
                        </p>
                        <p>
                            If you do not agree with (or cannot comply with) Agreements, then you
                            may not use the Service. These Terms apply to all visitors, users and
                            others who wish to access or use Service.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Communications</h3>
                        <p>
                            By using our Service, you agree to subscribe to newsletters, marketing
                            or promotional materials and other information we may send.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Purchases</h3>
                        <p className="mb-4">
                            If you wish to purchase any product or service made available through
                            Service (“Purchase”), you may be asked to supply certain information
                            relevant to your Purchase including but not limited to, your credit or
                            debit card number, the expiration date of your card, your billing
                            address, and your shipping information.
                        </p>
                        <p className="mb-4">
                            You represent and warrant that: (i) you have the legal right to use any
                            card(s) or other payment method(s) in connection with any Purchase; and
                            that (ii) the information you supply to us is true, correct and
                            complete.
                        </p>
                        <p className="mb-4">
                            We may employ the use of third party services for the purpose of
                            facilitating payment and the completion of Purchases. By submitting your
                            information, you grant us the right to provide the information to these
                            third parties subject to our Privacy Policy.
                        </p>
                        <p>
                            We reserve the right to refuse or cancel your order at any time for
                            reasons including but not limited to: product or service availability,
                            errors in the description or price of the product or service, error in
                            your order, or if fraud or an unauthorized or illegal transaction is
                            suspected.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Prohibited Uses</h3>
                        <p className="mb-4">
                            You may use Service only for lawful purposes and in accordance with
                            Terms. You agree not to use Service:
                        </p>
                        <ul className="marker:text-primary ml-6 list-outside list-disc space-y-2">
                            <li>
                                In any way that violates any applicable national or international
                                law or regulation.
                            </li>
                            <li>
                                For the purpose of exploiting, harming, or attempting to exploit or
                                harm minors in any way.
                            </li>
                            <li>
                                To transmit, or procure the sending of, any advertising or
                                promotional material, including spam.
                            </li>
                            <li>
                                To impersonate or attempt to impersonate Company, a Company
                                employee, another user, or entity.
                            </li>
                            <li>
                                In any way that infringes upon the rights of others, or is illegal,
                                threatening, fraudulent, or harmful.
                            </li>
                            <li>
                                To engage in any conduct that restricts or inhibits anyone’s use or
                                enjoyment of Service.
                            </li>
                            <li>
                                Use any robot, spider, or other automatic device, process, or means
                                to access Service for any purpose without consent.
                            </li>
                            <li>
                                Introduce any viruses, trojan horses, worms, logic bombs, or other
                                material which is malicious or technologically harmful.
                            </li>
                            <li>
                                Attempt to gain unauthorized access to, interfere with, damage, or
                                disrupt any parts of Service or servers.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Accounts</h3>
                        <p className="mb-4">
                            When you create an account with us, you guarantee that you are above the
                            age of 18, and that the information you provide us is accurate,
                            complete, and current at all times. Inaccurate, incomplete, or obsolete
                            information may result in the immediate termination of your account.
                        </p>
                        <p>
                            You are responsible for maintaining the confidentiality of your account
                            and password. You must notify us immediately upon becoming aware of any
                            breach of security or unauthorized use of your account.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Legal Details</h3>
                        <p>
                            If incorrect GST or any other Legal details are provided by the
                            customer, the company will not be held responsible for any discrepancies
                            in accounting data resulting from the same. Upload the GST Document and
                            add the GST Number, Bank Account Details is Mandatory, If you want to
                            get the GST benefits.
                        </p>
                    </section>
                </div>
            );

        case 'privacy':
            return (
                <div className="space-y-6">
                    <h2 className="mb-6 text-2xl font-extrabold text-slate-900">Privacy Policy</h2>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Introduction</h3>
                        <p className="mb-4">
                            Welcome to <strong>[Your Platform Name]</strong>.{' '}
                            <strong>[YOUR COMPANY LEGAL NAME]</strong> (“us”, “we”, or “our”)
                            operates <strong>[yourdomain.com]</strong> (hereinafter referred to as
                            “Service”).
                        </p>
                        <p className="mb-4">
                            Our Privacy Policy governs your visit to{' '}
                            <strong>[yourdomain.com]</strong>, and explains how we collect,
                            safeguard and disclose information that results from your use of our
                            Service.
                        </p>
                        <p>
                            We use your data to provide and improve Service. By using Service, you
                            agree to the collection and use of information in accordance with this
                            policy. Unless otherwise defined in this Privacy Policy, the terms used
                            in this Privacy Policy have the same meanings as in our Terms and
                            Conditions.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Definitions</h3>
                        <ul className="marker:text-primary ml-6 list-outside list-disc space-y-2">
                            <li>
                                <strong>SERVICE</strong> means the <strong>[yourdomain.com]</strong>{' '}
                                website operated by <strong>[YOUR COMPANY LEGAL NAME]</strong>.
                            </li>
                            <li>
                                <strong>PERSONAL DATA</strong> means data about a living individual
                                who can be identified from those data.
                            </li>
                            <li>
                                <strong>USAGE DATA</strong> is data collected automatically either
                                generated by the use of Service or from Service infrastructure
                                itself.
                            </li>
                            <li>
                                <strong>COOKIES</strong> are small files stored on your device
                                (computer or mobile device).
                            </li>
                            <li>
                                <strong>DATA CONTROLLER</strong> means a natural or legal person who
                                determines the purposes for which and the manner in which any
                                personal data are, or are to be, processed.
                            </li>
                            <li>
                                <strong>DATA PROCESSORS (OR SERVICE PROVIDERS)</strong> means any
                                natural or legal person who processes the data on behalf of the Data
                                Controller.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Information Collection and Use
                        </h3>
                        <p className="mb-4">
                            We collect several different types of information for various purposes
                            to provide and improve our Service to you.
                        </p>

                        <h4 className="mt-4 mb-2 font-bold text-slate-800">
                            Types of Data Collected:
                        </h4>
                        <ul className="marker:text-primary mb-4 ml-6 list-outside list-disc space-y-2">
                            <li>
                                <strong>Personal Data:</strong> Email address, First name and last
                                name, Phone number, Address, Country, State, Province, ZIP/Postal
                                code, City.
                            </li>
                            <li>
                                <strong>Usage Data:</strong> We may collect information such as your
                                computer’s Internet Protocol address (e.g. IP address), browser
                                type, browser version, the pages of our Service that you visit, the
                                time and date of your visit, the time spent on those pages, and
                                unique device identifiers.
                            </li>
                            <li>
                                <strong>Location Data:</strong> We may use and store information
                                about your location if you give us permission to do so.
                            </li>
                            <li>
                                <strong>Tracking & Cookies Data:</strong> Session Cookies (to
                                operate our Service), Preference Cookies (to remember your
                                preferences), Security Cookies (for security purposes), and
                                Advertising Cookies.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Use of Data</h3>
                        <p className="mb-2">
                            <strong>[YOUR COMPANY LEGAL NAME]</strong> uses the collected data for
                            various purposes:
                        </p>
                        <ul className="marker:text-primary ml-6 list-outside list-disc space-y-2">
                            <li>To provide and maintain our Service;</li>
                            <li>To notify you about changes to our Service;</li>
                            <li>
                                To allow you to participate in interactive features of our Service
                                when you choose to do so;
                            </li>
                            <li>To provide customer support;</li>
                            <li>
                                To gather analysis or valuable information so that we can improve
                                our Service;
                            </li>
                            <li>
                                To monitor the usage of our Service and detect, prevent and address
                                technical issues;
                            </li>
                            <li>
                                To carry out our obligations and enforce our rights arising from any
                                contracts entered into between you and us, including for billing and
                                collection.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Retention & Transfer of Data
                        </h3>
                        <p className="mb-4">
                            We will retain your Personal Data only for as long as is necessary for
                            the purposes set out in this Privacy Policy, to the extent necessary to
                            comply with our legal obligations, resolve disputes, and enforce our
                            legal agreements and policies.
                        </p>
                        <p>
                            Your information, including Personal Data, may be transferred to – and
                            maintained on – computers located outside of your state, province,
                            country or other governmental jurisdiction where the data protection
                            laws may differ from those of your jurisdiction. If you are located
                            outside INDIA and choose to provide information to us, please note that
                            we transfer the data, including Personal Data, to INDIA and process it
                            there.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Disclosure of Data</h3>
                        <p className="mb-2">
                            We may disclose personal information that we collect, or you provide:
                        </p>
                        <ul className="marker:text-primary ml-6 list-outside list-disc space-y-2">
                            <li>
                                <strong>Disclosure for Law Enforcement:</strong> Under certain
                                circumstances, we may be required to disclose your Personal Data if
                                required to do so by law or in response to valid requests by public
                                authorities.
                            </li>
                            <li>
                                <strong>Business Transaction:</strong> If we or our subsidiaries are
                                involved in a merger, acquisition or asset sale, your Personal Data
                                may be transferred.
                            </li>
                            <li>
                                <strong>Other Cases:</strong> To our subsidiaries, affiliates,
                                contractors, service providers, and other third parties we use to
                                support our business.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Data Protection Rights (GDPR, CCPA, CalOPPA)
                        </h3>
                        <p className="mb-4">
                            Depending on your location, you may have specific data protection rights
                            under regulations like the GDPR (EU), CalOPPA (California), and CCPA
                            (California). We aim to take reasonable steps to allow you to correct,
                            amend, delete, or limit the use of your Personal Data.
                        </p>
                        <p className="mb-4">
                            You have the right to access, update, delete, object to processing,
                            restrict processing, or request data portability of your Personal Data.
                            We do not sell your personal information for monetary consideration.
                        </p>
                        <p>
                            To exercise any of these rights, please contact us at{' '}
                            <strong>[support@yourdomain.com]</strong>. Please note that we may ask
                            you to verify your identity before responding to such requests.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Service Providers & Payments
                        </h3>
                        <p className="mb-4">
                            We may employ third party companies and individuals to facilitate our
                            Service ("Service Providers"), provide Service on our behalf, perform
                            Service-related services or assist us in analyzing how our Service is
                            used (e.g., Analytics, CI/CD tools, Behavioral Remarketing).
                        </p>
                        <p>
                            We may provide paid products and/or services within Service. In that
                            case, we use third-party services for payment processing. We will not
                            store or collect your payment card details. That information is provided
                            directly to our third-party payment processors whose use of your
                            personal information is governed by their Privacy Policy. These payment
                            processors adhere to the standards set by PCI-DSS.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Children’s Privacy</h3>
                        <p>
                            Our Services are not intended for use by children under the age of 18.
                            We do not knowingly collect personally identifiable information from
                            Children under 18. If you become aware that a Child has provided us with
                            Personal Data, please contact us. If we become aware that we have
                            collected Personal Data from Children without verification of parental
                            consent, we take steps to remove that information from our servers.
                        </p>
                    </section>
                </div>
            );
            return (
                <div className="space-y-6">
                    <h2 className="mb-6 text-2xl font-extrabold text-slate-900">Privacy Policy</h2>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Introduction</h3>
                        <p className="mb-4">
                            Welcome to <strong>[Your Platform Name]</strong>.{' '}
                            <strong>[YOUR COMPANY LEGAL NAME]</strong> (“us”, “we”, or “our”)
                            operates <strong>[yourdomain.com]</strong>.
                        </p>
                        <p>
                            Our Privacy Policy governs your visit to our site, and explains how we
                            collect, safeguard and disclose information that results from your use
                            of our Service. By using Service, you agree to the collection and use of
                            information in accordance with this policy.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Information Collection and Use
                        </h3>
                        <p className="mb-4">
                            We collect several different types of information for various purposes
                            to provide and improve our Service to you.
                        </p>
                        <h4 className="mb-2 font-bold text-slate-800">Types of Data Collected:</h4>
                        <ul className="marker:text-primary mb-4 ml-6 list-outside list-disc space-y-2">
                            <li>
                                <strong>Personal Data:</strong> Email address, First name and last
                                name, Phone number, Address, State, Province, ZIP/Postal code, City.
                            </li>
                            <li>
                                <strong>Usage Data:</strong> Internet Protocol address (e.g. IP
                                address), browser type, browser version, pages visited, time and
                                date of visit.
                            </li>
                            <li>
                                <strong>Tracking & Cookies Data:</strong> Session Cookies,
                                Preference Cookies, Security Cookies, Advertising Cookies.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Use of Data</h3>
                        <p className="mb-2">We use the collected data for various purposes:</p>
                        <ul className="marker:text-primary ml-6 list-outside list-disc space-y-2">
                            <li>To provide and maintain our Service.</li>
                            <li>To notify you about changes to our Service.</li>
                            <li>To provide customer support.</li>
                            <li>
                                To gather analysis or valuable information so that we can improve
                                our Service.
                            </li>
                            <li>To detect, prevent and address technical issues.</li>
                            <li>
                                To carry out our obligations and enforce our rights arising from any
                                contracts entered into between you and us, including for billing and
                                collection.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Disclosure of Data</h3>
                        <p className="mb-4">
                            We may disclose personal information that we collect, or you provide:
                        </p>
                        <ul className="marker:text-primary ml-6 list-outside list-disc space-y-2">
                            <li>
                                <strong>Disclosure for Law Enforcement:</strong> Under certain
                                circumstances, we may be required to disclose your Personal Data if
                                required to do so by law.
                            </li>
                            <li>
                                <strong>Business Transaction:</strong> If we are involved in a
                                merger, acquisition or asset sale.
                            </li>
                            <li>
                                <strong>To our subsidiaries and affiliates</strong>, or contractors
                                and service providers to support our business.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Security of Data</h3>
                        <p>
                            The security of your data is important to us but remember that no method
                            of transmission over the Internet or method of electronic storage is
                            100% secure. While we strive to use commercially acceptable means to
                            protect your Personal Data, we cannot guarantee its absolute security.
                        </p>
                    </section>
                </div>
            );

        case 'kyc':
            return (
                <div className="space-y-6">
                    <h2 className="mb-6 text-2xl font-extrabold text-slate-900">KYC Policy</h2>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Introduction</h3>
                        <p className="mb-4">
                            <strong>[Your Platform Name]</strong> is committed to ensuring a secure
                            and transparent platform for all Dropshippers. To comply with legal and
                            financial regulations, every Dropshipper must complete the Know Your
                            Customer (KYC) verification process by providing accurate and valid
                            information.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Mandatory KYC Information
                        </h3>
                        <p className="mb-4">
                            Each Dropshipper is required to provide the following information
                            accurately during the KYC verification process:
                        </p>
                        <ul className="marker:text-primary mb-4 ml-6 list-outside list-disc space-y-2">
                            <li>Bank Account Number</li>
                            <li>Account Holder Name (As per the bank records)</li>
                            <li>
                                GST (Goods and Services Tax) Certificate & Number (if applicable)
                            </li>
                            <li>PAN Details</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Responsibility of Dropshippers
                        </h3>
                        <ul className="marker:text-primary ml-6 list-outside list-disc space-y-2">
                            <li>
                                The Dropshipper is solely responsible for ensuring that the details
                                provided during the KYC process are accurate and up to date.
                            </li>
                            <li>
                                Any incorrect, false, or misleading information submitted by the
                                Dropshipper may result in delays, non-payment, or account
                                suspension.
                            </li>
                            <li>
                                The Company will not be responsible for any financial loss, failed
                                transactions, or legal consequences arising due to incorrect or
                                fraudulent details provided by the Dropshipper.
                            </li>
                            <li>
                                It will be the dropshipper's responsibility to verify GST details
                                added in their profile for correct GST filing. We will not be liable
                                for any type of wrong GST filing if the details available in the
                                dropshipper profile are wrong.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Verification & Compliance
                        </h3>
                        <p className="mb-4">
                            We reserve the right to verify the provided details through authorized
                            third-party services or regulatory bodies. Any discrepancies found in
                            the KYC details may lead to rejection of the application or temporary
                            suspension of services until the correct details are provided.
                        </p>
                    </section>
                </div>
            );

        case 'shipping':
            return (
                <div className="space-y-6">
                    <h2 className="mb-6 text-2xl font-extrabold text-slate-900">Shipping Policy</h2>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-bold text-amber-800">
                            THIS SHIPPING POLICY IS ONLY FOR INDIA ORDERS.
                        </p>
                    </div>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Processing Time</h3>
                        <p>
                            100% of orders are shipped from our warehouse within 1-2 business days
                            except public holidays. Orders placed over the weekend are dispatched on
                            Mondays.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Delivery Timelines</h3>
                        <ul className="marker:text-primary ml-6 list-outside list-disc space-y-2">
                            <li>
                                <strong>Standard Shipping (Gujarat):</strong> Delivery 6-7 business
                                days after Dispatch.
                            </li>
                            <li>
                                <strong>Standard Shipping (All Other States):</strong> Delivery 7-10
                                business days after Dispatch (except few pincodes where the delivery
                                time given by the courier company can be up to 15 business days).
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Tracking & Carriers</h3>
                        <p className="mb-4">
                            Once your order has been shipped, we will update the tracking details in
                            your order information. We use premium carriers like DTDC, Blue Dart,
                            and Ecom Express for deliveries, which can be changed depending upon the
                            serviceable pincodes.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Failed Delivery</h3>
                        <p>
                            If the package cannot be delivered to the given shipping address due to
                            causes ascribable to the absent cooperation of the customer (wrong or
                            incorrect shipping address, absent receiver) or if the customer refuses
                            to collect the package, the package will be returned to the sender at
                            the customer’s expense. This expense includes shipping costs incurred
                            and will be deducted from the total of the order to be refunded.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Shipping Delays and Transit Issues
                        </h3>
                        <p className="mb-4">
                            In the event that your shipment is delayed or remains in transit for
                            longer than expected, please be aware that it may take up to 45 days for
                            the courier service to resolve the issue and complete the delivery.
                            During this time, the courier company is responsible for managing any
                            transit-related problems.
                        </p>
                        <p>
                            Please note that we are not responsible for any delays caused by the
                            courier company once the package leaves our facility.
                        </p>
                    </section>
                </div>
            );

        case 'returns':
            return (
                <div className="space-y-6">
                    <h2 className="mb-6 text-2xl font-extrabold text-slate-900">
                        Refund & Return Policy
                    </h2>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Return Request Period
                        </h3>
                        <p className="mb-2">
                            <strong>48-Hour Notification:</strong> To ensure we can properly assess
                            any issues with the product, you must notify us within 48 hours of
                            receiving the product. Requests submitted after 48 hours may not be
                            accepted.
                        </p>
                        <p>
                            The return/refund request must be submitted by raising a support ticket
                            from the client portal. Any details submitted by any other medium will
                            not be considered valid.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Return Eligibility</h3>
                        <ul className="marker:text-primary mb-4 ml-6 list-outside list-disc space-y-2">
                            <li>
                                <strong>Damaged or Defective Products:</strong> If the product is
                                damaged or defective upon arrival, the customer must provide an
                                unboxing video showing the damage.
                            </li>
                            <li>
                                <strong>Missing Items:</strong> An unboxing video must be provided
                                showing the contents of the package clearly.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Refund Eligibility</h3>
                        <p className="mb-4">
                            Upon confirmation of the damage or defect through the unboxing video, a
                            full or partial refund will be processed based on our approval.{' '}
                            <strong>
                                No return or refund can be processed for defective electronics
                                items.
                            </strong>
                        </p>
                        <p>
                            Refund amount will be subject to approval depending on the condition of
                            the item, type of item, condition of the unboxing video, and nature of
                            the defect.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Rejection/Denial of Parcel
                        </h3>
                        <p>
                            If the customer rejects or denies acceptance of a parcel after it has
                            been dispatched, <strong>2 times the original shipping charge</strong>{' '}
                            will be deducted (this includes both forward and reverse shipping costs)
                            before issuing any refunds.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Non-Returnable Items
                        </h3>
                        <ul className="marker:text-primary ml-6 list-outside list-disc space-y-2">
                            <li>
                                Products that have been used, opened, or damaged by the customer.
                            </li>
                            <li>Products marked as non-returnable in the product description.</li>
                            <li>Electronic Products.</li>
                        </ul>
                    </section>
                </div>
            );

        case 'cancellation':
            return (
                <div className="space-y-6">
                    <h2 className="mb-6 text-2xl font-extrabold text-slate-900">
                        Order Cancellation Policy
                    </h2>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            No Cancellations After Confirmation
                        </h3>
                        <p className="mb-4">
                            Once an order is confirmed, it cannot be cancelled by the Dropshipper.
                            We process all orders immediately to ensure prompt delivery, and
                            therefore, cancellations are not permitted.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            No Modifications Allowed
                        </h3>
                        <p className="mb-4">
                            Once the order is confirmed, no changes or modifications (such as
                            product additions, changes in address, or updates to the order) are
                            allowed. Please ensure all details are accurate before confirming your
                            order.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Exceptions</h3>
                        <p>
                            In rare circumstances, such as if the item is out of stock, a pricing
                            error occurs, or the Pincode provided for delivery is not serviceable,
                            we reserve the right to cancel the order. In such cases, the full amount
                            will be refunded to you.
                        </p>
                    </section>
                </div>
            );

        case 'withdrawal':
            return (
                <div className="space-y-6">
                    <h2 className="mb-6 text-2xl font-extrabold text-slate-900">
                        Withdrawal Policy
                    </h2>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Bank Details Requirement
                        </h3>
                        <p className="mb-4">
                            To initiate a withdrawal from your wallet, you must ensure that your
                            bank details are correctly entered in the profile section of your
                            account. This is a mandatory step for processing any bank transfers.
                        </p>
                        <p className="mb-4">
                            In case of payment failure by the banking system, we will only make a
                            total of 2 attempts of payment transfer to the same bank account. If it
                            fails on both attempts, the dropshipper will have to provide new bank
                            details.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Thresholds & Timelines
                        </h3>
                        <ul className="marker:text-primary ml-6 list-outside list-disc space-y-2">
                            <li>
                                <strong>Minimum Withdrawal:</strong> The minimum withdrawal amount
                                is 1000 INR.
                            </li>
                            <li>
                                <strong>Processing Time:</strong> Bank transfers will typically be
                                processed within 7 working days.
                            </li>
                            <li>
                                <strong>COD Remittance Cycle:</strong> For all COD orders, we
                                receive the payment from our courier partners 10 days after the
                                order is marked as delivered. After the COD Remittance is remitted
                                into our accounts, it will be reflected in your wallet within 24
                                hours.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Handling COD Discrepancies
                        </h3>
                        <p>
                            In the unlikely event that a technical bug results in us receiving a
                            Cash on Delivery (COD) amount from the courier company that is less than
                            the COD selling price specified by the Seller, we will promptly transfer
                            the <em>actual</em> amount received from the courier partner. The Seller
                            acknowledges that in these rare instances, the amount transferred will
                            reflect the actual funds received from the courier.
                        </p>
                    </section>
                </div>
            );

        case 'grievance':
            return (
                <div className="space-y-6">
                    <h2 className="mb-6 text-2xl font-extrabold text-slate-900">
                        Grievance Redressal Policy
                    </h2>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            How to Raise a Grievance
                        </h3>
                        <p className="mb-4">
                            If you encounter any issues or have any concerns, please follow the
                            steps below to ensure your grievance is addressed promptly:
                        </p>
                        <ul className="marker:text-primary mb-4 ml-6 list-outside list-disc space-y-2">
                            <li>Raise a ticket through our Customer Support portal.</li>
                            <li>Provide your full name and contact information.</li>
                            <li>Provide the Order number or transaction ID.</li>
                            <li>
                                Include a brief description of your grievance with relevant
                                screenshots.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Timelines</h3>
                        <ul className="marker:text-primary mb-4 ml-6 list-outside list-disc space-y-2">
                            <li>
                                <strong>Acknowledgement:</strong> Upon receipt of your grievance, we
                                will acknowledge it within 48 hours.
                            </li>
                            <li>
                                <strong>Resolution:</strong> We aim to resolve all grievances within
                                7 working days. In cases where more time is required, we will notify
                                you of the expected resolution date.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">Grievance Officer</h3>
                        <p className="mb-2">
                            In case the issue is not resolved satisfactorily through our customer
                            support channels, you can escalate the matter to our Grievance Officer.
                        </p>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="font-bold text-slate-900">Name: Grievance Officer</p>
                            <p className="text-slate-600">Email: [support@yourdomain.com]</p>
                        </div>
                    </section>
                </div>
            );

        case 'product':
            return (
                <div className="space-y-6">
                    <h2 className="mb-6 text-2xl font-extrabold text-slate-900">
                        Product Description Policy
                    </h2>

                    <section>
                        <h3 className="text-primary mb-2 text-lg font-bold">
                            Color and Variation Availability
                        </h3>
                        <p className="mb-4">
                            At <strong>[Your Platform Name]</strong>, we offer our products in a
                            wide range of colors. Due to the nature of our product sourcing, many of
                            our items are available in multiple colors, and we process orders
                            accordingly.
                        </p>
                        <p>
                            To ensure efficient processing and prompt delivery, the specific color
                            of your product will be selected based on availability at the time of
                            dispatch. Please note that color preferences cannot be specified during
                            the ordering process. Your order will be processed according to the
                            color available in stock which cannot be pre-decided while placing or
                            confirming the order. While we showcase a limited selection of colors in
                            our product images, rest assured that a variety of colors is available.
                        </p>
                    </section>
                </div>
            );

        default:
            return null;
    }
}
