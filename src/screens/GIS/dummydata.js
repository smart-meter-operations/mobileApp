export const dummyDTs = [
  { id: 'DT1', coordinate: { latitude: 18.5204, longitude: 73.8567 }, name: 'DT-Koregaon' },
  { id: 'DT2', coordinate: { latitude: 18.5314, longitude: 73.8445 }, name: 'DT-Shivaji' },
  { id: 'DT3', coordinate: { latitude: 18.5074, longitude: 73.8077 }, name: 'DT-Kothrud' },
  { id: 'DT4', coordinate: { latitude: 18.5590, longitude: 73.7898 }, name: 'DT-Baner' },
  { id: 'DT5', coordinate: { latitude: 18.5916, longitude: 73.7389 }, name: 'DT-Hinjewadi' },
];

export const dummySubstations = [
  { id: 'SS1', coordinate: { latitude: 18.545, longitude: 73.865 }, name: 'Koregaon Park SS' },
  { id: 'SS2', coordinate: { latitude: 18.500, longitude: 73.780 }, name: 'Warje SS' },
];

export const dummyFeeders = [
  { id: 'F1', coordinate: { latitude: 18.530, longitude: 73.810 }, name: 'Feeder-A1' },
  { id: 'F2', coordinate: { latitude: 18.570, longitude: 73.750 }, name: 'Feeder-B2' },
];

export const dummyPowerLines = [
  { id: 'L1', coordinates: [dummyDTs[0].coordinate, dummyDTs[1].coordinate] },
  { id: 'L2', coordinates: [dummyDTs[1].coordinate, dummyDTs[2].coordinate] },
  { id: 'L3', coordinates: [dummyDTs[2].coordinate, dummyDTs[3].coordinate] },
  { id: 'L4', coordinates: [dummyDTs[3].coordinate, dummyDTs[4].coordinate] },
  { id: 'L5', coordinates: [dummyDTs[0].coordinate, dummyDTs[3].coordinate] }, // Branching line
];

export const ciUsers = [
  { id: 'CI-1', name: 'Rajesh Verma', address: 'Aundh, Pune', consumerNumber: 'CI-1001', coordinate: { latitude: 18.5586, longitude: 73.8157 } },
  { id: 'CI-2', name: 'Priya Singh', address: 'Viman Nagar, Pune', consumerNumber: 'CI-1002', coordinate: { latitude: 18.5679, longitude: 73.9143 } },
  { id: 'CI-3', name: 'Amit Patel', address: 'Wakad, Pune', consumerNumber: 'CI-1003', coordinate: { latitude: 18.5944, longitude: 73.7495 } },
];

export const miUsers = [
  { id: 'MI-1', name: 'Sunita Williams', address: 'Kharadi, Pune', consumerNumber: 'MI-2001', coordinate: { latitude: 18.5519, longitude: 73.9512 } },
  { id: 'MI-2', name: 'Deepak Kumar', address: 'Pimple Saudagar, Pune', consumerNumber: 'MI-2002', coordinate: { latitude: 18.5991, longitude: 73.7921 } },
];
