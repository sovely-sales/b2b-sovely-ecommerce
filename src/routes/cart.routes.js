import { Router } from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    assignCustomerToCartItem,
} from '../controllers/cart.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);
router.route('/').get(getCart).post(addToCart).delete(clearCart);
router.route('/item/:itemId').put(updateCartItem).delete(removeFromCart);
router.route('/item/:itemId/customer').put(assignCustomerToCartItem);

export default router;
