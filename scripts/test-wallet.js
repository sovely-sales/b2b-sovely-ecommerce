async function testAddMoney() {
    try {
        const testEmail = `test-${Date.now()}@example.com`;
        const testPass = 'password123';

        await fetch('http://127.0.0.1:8000/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Wallet', email: testEmail, password: testPass })
        });

        const loginRes = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPass })
        });

        const loginData = await loginRes.json();
        const cookieStr = loginRes.headers.get('set-cookie');
        if (!cookieStr) throw new Error("No cookie received on login");
        const cookie = cookieStr.split(';')[0];

        console.log("Logged in, attempting wallet topup!");

        const res = await fetch('http://127.0.0.1:8000/api/v1/wallet/add-money', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify({ amount: 100 })
        });

        const data = await res.json();
        console.log("API Result:", data);

        // Wait briefly to allow async logs to flush to the server terminal
        await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
        console.error("API Error:");
        console.dir(e);
    }
}

testAddMoney();
