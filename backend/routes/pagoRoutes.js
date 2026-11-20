const express = require('express');
const router = express.Router();
const Pago = require('../models/Pago');
const Cliente = require('../models/Cliente');
const Entrega = require('../models/Entrega');

const obtenerDeudaCliente = (cliente) => {
  const valor = Number(cliente.deuda ?? cliente.saldoPendiente ?? 0);
  return Number.isNaN(valor) ? 0 : Math.max(0, valor);
};

// Obtener todos los pagos
router.get('/', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.clienteId) {
      filtro.cliente = req.query.clienteId;
    }

    const pagos = await Pago.find(filtro)
      .populate('cliente', 'nombre departamento telefono deuda saldoPendiente')
      .sort({ fechaPago: -1, createdAt: -1 });

    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ message: 'Error al obtener el historial de pagos' });
  }
});

// Obtener un pago por ID
router.get('/:id', async (req, res) => {
  try {
    const pago = await Pago.findById(req.params.id).populate(
      'cliente',
      'nombre departamento telefono deuda saldoPendiente'
    );
    if (!pago) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }
    res.json(pago);
  } catch (error) {
    console.error('Error al buscar pago:', error);
    res.status(500).json({ message: 'Error al obtener el pago' });
  }
});

// Registrar un nuevo pago / abono con validación de deuda
router.post('/', async (req, res) => {
  try {
    const clienteId = req.body.cliente || req.body.clienteId;
    const montoAbonadoNum = Number(req.body.montoAbonado ?? req.body.monto ?? 0);

    if (!clienteId) {
      return res.status(400).json({ message: 'Debe seleccionar un cliente válido' });
    }

    if (Number.isNaN(montoAbonadoNum) || montoAbonadoNum <= 0) {
      return res.status(400).json({
        message: 'El monto del abono debe ser mayor a US$ 0.00.',
      });
    }

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const deudaActual = obtenerDeudaCliente(cliente);

    if (montoAbonadoNum > deudaActual + 0.0001) {
      return res.status(400).json({
        message: `El pago de la deuda debe ser el monto total de la deuda o menor a ella (Deuda actual: US$ ${deudaActual.toFixed(
          2
        )}).`,
      });
    }

    const nuevoPago = new Pago({
      cliente: cliente._id,
      entrega: req.body.entrega || null,
      montoAbonado: Number(montoAbonadoNum.toFixed(2)),
      montoBs: Number(req.body.montoBs || 0),
      tasaCambio: Number(req.body.tasaCambio || 0),
      metodoPago: req.body.metodoPago || 'pago_movil',
      referenciaPago: req.body.referenciaPago ? String(req.body.referenciaPago).trim() : 'S/R',
      fechaPago: req.body.fechaPago ? new Date(req.body.fechaPago) : new Date(),
    });

    await nuevoPago.save();

    const nuevaDeuda = Math.max(0, Number((deudaActual - montoAbonadoNum).toFixed(2)));
    if ('deuda' in cliente) {
      cliente.deuda = nuevaDeuda;
    }
    if ('saldoPendiente' in cliente) {
      cliente.saldoPendiente = nuevaDeuda;
    }
    await cliente.save();

    if (Entrega) {
      let restante = montoAbonadoNum;
      const entregasPendientes = await Entrega.find({
        cliente: cliente._id,
        pagado: { $ne: true },
      }).sort({ createdAt: 1 });

      for (const entrega of entregasPendientes) {
        if (restante <= 0.0001) break;
        const montoEntrega = Number(entrega.total ?? entrega.montoTotal ?? 0);
        const pendienteActual =
          entrega.saldoPendiente !== undefined && entrega.saldoPendiente !== null
            ? Number(entrega.saldoPendiente)
            : montoEntrega;

        if (pendienteActual > 0) {
          const descontar = Math.min(pendienteActual, restante);
          const nuevoSaldo = Math.max(0, Number((pendienteActual - descontar).toFixed(2)));
          restante = Math.max(0, Number((restante - descontar).toFixed(2)));

          if ('saldoPendiente' in entrega) {
            entrega.saldoPendiente = nuevoSaldo;
          }
          if (nuevoSaldo <= 0.0001 && 'pagado' in entrega) {
            entrega.pagado = true;
          }
          await entrega.save();
        }
      }
    }

    const pagoPoblado = await Pago.findById(nuevoPago._id).populate(
      'cliente',
      'nombre departamento telefono deuda saldoPendiente'
    );

    res.status(201).json({
      pago: pagoPoblado,
      deudaRestante: nuevaDeuda,
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ message: 'Error al registrar el pago' });
  }
});

// Eliminar un pago y devolver el monto a la deuda del cliente
router.delete('/:id', async (req, res) => {
  try {
    const pago = await Pago.findById(req.params.id);
    if (!pago) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    const cliente = await Cliente.findById(pago.cliente);
    if (cliente) {
      const deudaActual = obtenerDeudaCliente(cliente);
      const deudaRestaurada = Number((deudaActual + Number(pago.montoAbonado || 0)).toFixed(2));
      if ('deuda' in cliente) {
        cliente.deuda = deudaRestaurada;
      }
      if ('saldoPendiente' in cliente) {
        cliente.saldoPendiente = deudaRestaurada;
      }
      await cliente.save();
    }

    await pago.deleteOne();
    res.json({ message: 'Pago eliminado y deuda actualizada' });
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ message: 'Error al eliminar el pago' });
  }
});

module.exports = router;