const router       = require('express').Router();
const ctrl         = require('../controllers/ordersController');
const optionalAuth = require('../middleware/optionalAuth');

router.use(optionalAuth);

router.post('/',    ctrl.create);
router.get('/',     ctrl.list);
router.get('/:id',  ctrl.get);

module.exports = router;
