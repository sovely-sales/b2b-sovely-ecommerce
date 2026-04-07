export const calculateItemWeights = (product, qty) => {
    const actualWeightKg = (product.weightGrams || 0) / 1000;
    const l = product.dimensions?.length || 0;
    const w = product.dimensions?.width || 0;
    const h = product.dimensions?.height || 0;
    const volWeightKg = (l * w * h) / 5000;

    const chargeableWeightPerUnit = Math.max(actualWeightKg, volWeightKg);

    return {
        actualWeight: actualWeightKg * qty,
        volumetricWeight: volWeightKg * qty,
        billableWeight: chargeableWeightPerUnit * qty,
    };
};

export const calculateSlabCharge = (totalWt) => {
    if (totalWt <= 0) totalWt = 0.5;

    let slab = 0;
    if (totalWt <= 0.5) slab = 0.5;
    else if (totalWt <= 1.0) slab = 1;
    else if (totalWt <= 2.0) slab = 2;
    else if (totalWt <= 3.0) slab = 3;
    else if (totalWt <= 4.0) slab = 4;
    else if (totalWt <= 5.0) slab = 5;
    else slab = Math.ceil(totalWt);

    let deliveryCharge = 0;
    switch (slab) {
        case 0.5:
            deliveryCharge = 50;
            break;
        case 1:
            deliveryCharge = 80;
            break;
        case 2:
            deliveryCharge = 100;
            break;
        case 3:
            deliveryCharge = 130;
            break;
        case 4:
            deliveryCharge = 145;
            break;
        case 5:
            deliveryCharge = 160;
            break;
        default:
            deliveryCharge = 160 + (slab - 5) * 30;
    }

    let packingCharge = 0;
    switch (slab) {
        case 0.5:
            packingCharge = 10;
            break;
        case 1:
            packingCharge = 15;
            break;
        case 2:
            packingCharge = 20;
            break;
        case 3:
            packingCharge = 25;
            break;
        case 4:
            packingCharge = 28;
            break;
        case 5:
            packingCharge = 30;
            break;
        default:
            packingCharge = 30 + (slab - 5) * 5;
    }

    return deliveryCharge + packingCharge;
};
