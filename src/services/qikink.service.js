import { ApiError } from '../utils/ApiError.js';

class QikinkService {
    constructor() {
        this.baseUrl = process.env.QIKINK_BASE_URL || 'https://api.qikink.com';
        this.clientId = process.env.QIKINK_CLIENT_ID;
        this.clientSecret = process.env.QIKINK_CLIENT_SECRET;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        if (!this.clientId || !this.clientSecret) {
            console.error(
                'Qikink credentials (QIKINK_CLIENT_ID, QIKINK_CLIENT_SECRET) are missing.'
            );
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Failed to authenticate with Qikink:', errorData);
                return null;
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            // Assuming token expires in 1 hour (3600 seconds), refreshing 5 minutes before expiry
            const expiresIn = data.expires_in || 3600;
            this.tokenExpiry = Date.now() + (expiresIn - 300) * 1000;

            return this.accessToken;
        } catch (error) {
            console.error('Error fetching Qikink token:', error);
            return null;
        }
    }

    async request(endpoint, options = {}, retries = 3) {
        const token = await this.getAccessToken();
        if (!token) {
            console.error('Cannot make Qikink request without a valid token.');
            return null;
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        const config = {
            ...options,
            headers,
        };

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, config);

                if (response.status === 401) {
                    // Token might have expired unexpectedly, clear token and retry
                    this.accessToken = null;
                    if (attempt < retries) continue;
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        `Qikink API Error ${response.status}: ${JSON.stringify(errorData)}`
                    );
                }

                return await response.json();
            } catch (error) {
                console.error(
                    `Qikink API request failed (Attempt ${attempt}/${retries}):`,
                    error.message
                );
                if (attempt === retries) {
                    throw error;
                }
                // Exponential backoff
                await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
            }
        }
    }

    async syncProduct(product) {
        try {
            const payload = {
                sku: product.sku,
                name: product.title,
                description: product.descriptionHTML || product.title,
                price: product.dropshipBasePrice,
                retail_price: product.suggestedRetailPrice,
                weight: product.weightGrams,
                hsn_code: product.hsnCode,
                status: product.status === 'active' ? 'publish' : 'draft',
                images: product.images?.map((img) => img.url) || [],
            };

            console.log(`Syncing product ${product.sku} to Qikink...`);
            const result = await this.request('/api/products', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            console.log(`Successfully synced product ${product.sku} to Qikink.`);
            return result;
        } catch (error) {
            console.error(`Failed to sync product ${product.sku} to Qikink:`, error.message);
            return null;
        }
    }

    async updateProduct(product) {
        try {
            const payload = {
                sku: product.sku,
                name: product.title,
                description: product.descriptionHTML || product.title,
                price: product.dropshipBasePrice,
                retail_price: product.suggestedRetailPrice,
                weight: product.weightGrams,
                hsn_code: product.hsnCode,
                status: product.status === 'active' ? 'publish' : 'draft',
                images: product.images?.map((img) => img.url) || [],
            };

            console.log(`Updating product ${product.sku} in Qikink...`);
            // Assuming Qikink supports updating via SKU or requires ID mapping.
            // Sending it to PUT /api/products/{sku} based on general REST patterns
            // If they require a specific Qikink ID, we'd need to store it upon creation.
            const result = await this.request(`/api/products/${product.sku}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            console.log(`Successfully updated product ${product.sku} in Qikink.`);
            return result;
        } catch (error) {
            console.error(`Failed to update product ${product.sku} in Qikink:`, error.message);
            return null;
        }
    }
}

export const qikinkService = new QikinkService();
