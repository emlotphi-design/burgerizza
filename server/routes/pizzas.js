const router      = require('express').Router();
const ctrl        = require('../controllers/pizzasController');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.post('/',      ctrl.create);
router.get('/',       ctrl.list);
router.delete('/:id', ctrl.remove);

module.exports = router;
