import 'dart:typed_data';

Uint8List calculateCRC(Uint8List data) {
  // Implement CRC16 calculation logic for MODBUS RTU
  return Uint8List(2);
}

Uint8List constructFrame(String command, List<int> params) {
  final buffer = Uint8List.fromList([
    0x01, // Address byte
    int.parse(command, radix: 16),
    ...params, // Parameters
  ]);
  return Uint8List.fromList([...buffer, ...calculateCRC(buffer)]);
}
