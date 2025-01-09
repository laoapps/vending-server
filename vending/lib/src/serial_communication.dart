import 'dart:typed_data';

class SerialCommunication {
  final String portPath;
  final int baudRate;

  SerialCommunication({required this.portPath, this.baudRate = 9600});

  Future<void> write(Uint8List data) async {
    // Implement serial port write logic
  }

  Stream<Uint8List> read() {
    // Implement serial port read logic
    return Stream.empty();
  }
}
