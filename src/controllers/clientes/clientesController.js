const { response } = require('express');
const Clientes = require('../../models/clientes/clientesModel');
const Usuario = require('../../models/usuarios/usuariosModel');

const getClientes = async (req, res = response) => {
  try {
    const clientes = await Clientes.findAll({
      include: [{ model: Usuario }],
    });
    res.json({ clientes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

const getCliente = async (req, res = response) => {
  const { id } = req.params;

  try {
    const cliente = await Clientes.findByPk(id, {
      include: [{ model: Usuario }],
    });

    if (cliente) {
      res.json(cliente);
    } else {
      res.status(404).json({ error: `No se encontró el cliente con ID ${id}` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el cliente' });
  }
};

const postCliente = async (req, res = response) => {
  try {
    const cliente = await Clientes.create(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el cliente' });
  }
};

const putCliente = async (req, res = response) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const cliente = await Clientes.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: `No se encontró un cliente con ID ${id}` });
    }

    await cliente.update(updatedData);
    res.json({ mensaje: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
};

const deleteCliente = async (req, res = response) => {
  const { id } = req.params;

  try {
    const cliente = await Clientes.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: `No se encontró un cliente con ID ${id}` });
    }

    await cliente.destroy();
    res.json({ mensaje: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el cliente' });
  }
};

module.exports = {
  getClientes,
  getCliente,
  postCliente,
  putCliente,
  deleteCliente,
}; 