const TEST_USER = {
  id: 8,
  nombre: "ViaRapida",
  email: "viarapidapruebas@peajes.com",
  password: "123456789",
  admin: false,
  tokenId: 10,
};

const PACKAGES = [
  {
    paquete_id: 1,
    nombre_producto: "Plan Via Rapida y Segura Particulares",
    descripcion: [
      {
        detalle: 1,
        titulo: "Beneficios",
        items: ["Paso automático por peajes", "Gestión en línea"],
      },
    ],
    valor: 120000,
    vigencia: 12,
  },
  {
    paquete_id: 2,
    nombre_producto: "Plan Via Rapida Empresarial",
    descripcion: [
      {
        detalle: 1,
        titulo: "Beneficios",
        items: [
          "Paso automático por peajes",
          "Gestión en línea",
          "Facturación consolidada por flota",
        ],
      },
    ],
    valor: 350000,
    vigencia: 12,
  },
  {
    paquete_id: 3,
    nombre_producto: "Plan Via Rapida Premium",
    descripcion: [
      {
        detalle: 1,
        titulo: "Beneficios",
        items: [
          "Paso automático por peajes",
          "Gestión en línea",
          "Soporte prioritario 24/7",
        ],
      },
    ],
    valor: 220000,
    vigencia: 24,
  },
];

module.exports = { TEST_USER, PACKAGES };
