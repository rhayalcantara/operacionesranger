/**
 * Provincias y municipios de República Dominicana
 * Usados en el módulo de ubicaciones
 */

export interface ProvinciaOption {
  value: string;
  label: string;
}

export const PROVINCIAS_RD: ProvinciaOption[] = [
  { value: 'SANTO_DOMINGO', label: 'Santo Domingo' },
  { value: 'DISTRITO_NACIONAL', label: 'Distrito Nacional' },
  { value: 'SANTIAGO', label: 'Santiago' },
  { value: 'LA_VEGA', label: 'La Vega' },
  { value: 'SAN_CRISTOBAL', label: 'San Cristóbal' },
  { value: 'PUERTO_PLATA', label: 'Puerto Plata' },
  { value: 'SAN_PEDRO', label: 'San Pedro de Macorís' },
  { value: 'LA_ROMANA', label: 'La Romana' },
  { value: 'DUARTE', label: 'Duarte' },
  { value: 'LA_ALTAGRACIA', label: 'La Altagracia' },
  { value: 'ESPAILLAT', label: 'Espaillat' },
  { value: 'AZUA', label: 'Azua' },
  { value: 'BARAHONA', label: 'Barahona' },
  { value: 'SAN_JUAN', label: 'San Juan' },
  { value: 'MONTE_PLATA', label: 'Monte Plata' }
];

export const MUNICIPIOS_POR_PROVINCIA: { [key: string]: string[] } = {
  'SANTO_DOMINGO': [
    'Santo Domingo Este',
    'Santo Domingo Norte',
    'Santo Domingo Oeste',
    'Boca Chica',
    'San Antonio de Guerra',
    'Los Alcarrizos',
    'Pedro Brand'
  ],
  'DISTRITO_NACIONAL': [
    'Distrito Nacional'
  ],
  'SANTIAGO': [
    'Santiago de los Caballeros',
    'Villa González',
    'Licey al Medio',
    'Tamboril',
    'Puñal',
    'San José de las Matas',
    'Jánico',
    'Bisonó',
    'Sabana Iglesia'
  ],
  'LA_VEGA': [
    'La Vega',
    'Constanza',
    'Jarabacoa',
    'Jima Abajo'
  ],
  'SAN_CRISTOBAL': [
    'San Cristóbal',
    'Villa Altagracia',
    'Yaguate',
    'Bajos de Haina',
    'Cambita Garabitos',
    'San Gregorio de Nigua',
    'Sabana Grande de Palenque'
  ],
  'PUERTO_PLATA': [
    'Puerto Plata',
    'Sosúa',
    'Cabarete',
    'Luperón',
    'Imbert',
    'Altamira',
    'Guananico',
    'Los Hidalgos',
    'Villa Isabela'
  ],
  'SAN_PEDRO': [
    'San Pedro de Macorís',
    'Ramón Santana',
    'Consuelo',
    'Quisqueya',
    'Los Llanos'
  ],
  'LA_ROMANA': [
    'La Romana',
    'Guaymate',
    'Villa Hermosa'
  ],
  'DUARTE': [
    'San Francisco de Macorís',
    'Arenoso',
    'Castillo',
    'Pimentel',
    'Villa Riva',
    'Las Guáranas',
    'Eugenio María de Hostos'
  ],
  'LA_ALTAGRACIA': [
    'Higüey',
    'San Rafael del Yuma'
  ],
  'ESPAILLAT': [
    'Moca',
    'Cayetano Germosén',
    'Gaspar Hernández',
    'Jamao al Norte'
  ],
  'AZUA': [
    'Azua de Compostela',
    'Las Charcas',
    'Las Yayas de Viajama',
    'Padre Las Casas',
    'Peralta',
    'Sabana Yegua',
    'Pueblo Viejo',
    'Tábara Arriba',
    'Guayabal',
    'Estebanía'
  ],
  'BARAHONA': [
    'Barahona',
    'Cabral',
    'Enriquillo',
    'Paraíso',
    'Vicente Noble',
    'El Peñón',
    'La Ciénaga',
    'Fundación',
    'Las Salinas',
    'Polo',
    'Jaquimeyes'
  ],
  'SAN_JUAN': [
    'San Juan de la Maguana',
    'Bohechío',
    'El Cercado',
    'Juan de Herrera',
    'Las Matas de Farfán',
    'Vallejuelo'
  ],
  'MONTE_PLATA': [
    'Monte Plata',
    'Bayaguana',
    'Peralvillo',
    'Sabana Grande de Boyá',
    'Yamasá',
    'Don Juan'
  ]
};
