const router      = require('express').Router();
const ctrl        = require('../controllers/ordersController');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.post('/',    ctrl.create);
router.get('/',     ctrl.list);
router.get('/:id',  ctrl.get);

module.exports = router;
