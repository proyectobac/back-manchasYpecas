const Proveedores = require('../../models/proveedores/proveedoresModel');
const Producto = require('../../models/productos/productosModel');

const getProveedores = async (req, res, next) => {
  try {
    const listProveedores = await Proveedores.findAll();
    res.json({ listProveedores });
  } catch (error) {
    next(error); // Elimina la segunda respuesta en caso de error
  }
};

const getProveedoresActivos = async (req, res, next) => {
  try {
    const listProveedores = await Proveedores.findAll({ where: { estado: "Activo" } });
    res.json({ listProveedores });
  } catch (error) {
    next(error);
  }
};

const getProveedor = async (req, res, next) => {
  const { id } = req.params;
  try {
    const proveedor = await Proveedores.findByPk(id);
    if (proveedor) {
      res.json(proveedor);
    } else {
      res.status(404).json({ error: `No se encontró el proveedor con ID ${id}` });
    }
  } catch (error) {
    next(error);
  }
};

const getProveedorProductos = async (req, res, next) => {
  const { id } = req.params;
  try {
    const proveedor = await Proveedores.findByPk(id);
    if (!proveedor) {
      return res.status(404).json({ error: `No se encontró un proveedor con ID ${id}` });
    }

    const productos = await Producto.findAll({ where: { id_proveedor: id } });
    res.json({ proveedor, productos });
  } catch (error) {
    next(error);
  }
};

const putProveedor = async (req, res, next) => {
  const { id } = req.params;
  const body = req.body;

  try {
    const proveedor = await Proveedores.findByPk(id);
    if (proveedor) {
      await proveedor.update(body);
      res.json({ msg: 'El proveedor fue actualizado exitosamente' });
    } else {
      res.status(404).json({ error: `No se encontró el proveedor con ID ${id}` });
    }
  } catch (error) {
    next(error);
  }
};

const cambiarEstadoProveedor = async (req, res, next) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const proveedor = await Proveedores.findByPk(id);
    if (proveedor) {
      await proveedor.update({ estado });
      res.json({ msg: 'El estado del proveedor fue actualizado exitosamente' });
    } else {
      res.status(404).json({ error: `No se encontró el proveedor con ID ${id}` });
    }
  } catch (error) {
    next(error);
  }
};

const postProveedor = async (req, res, next) => {
  const body = req.body;

  try {
    const newProveedor = await Proveedores.create(body);
    res.status(201).json({
      mensaje: 'Proveedor registrado con éxito',
      proveedor: newProveedor
    });
  } catch (error) {
    next(error); // Manejo del resto de errores con el middleware de errores
  }
};


const deleteProveedor = async (req, res, next) => {
  const { id } = req.params;

  try {
    const proveedor = await Proveedores.findByPk(id);
    if (proveedor) {
      await proveedor.destroy();
      res.json('El proveedor fue eliminado exitosamente');
    } else {
      res.status(404).json({ error: `No se encontró el proveedor con ID ${id}` });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProveedor,
  getProveedores,
  getProveedoresActivos,
  getProveedorProductos,
  postProveedor,
  putProveedor,
  cambiarEstadoProveedor,
  deleteProveedor
};
