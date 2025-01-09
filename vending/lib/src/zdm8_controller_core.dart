import 'serial_communication.dart';
import 'commands.dart';
import 'utils.dart';

class ZDM8Controller {
  final SerialCommunication serial;

  ZDM8Controller(this.serial);

  Future<void> sendCommand(String command, List<int> params) async {
    final frame = constructFrame(command, params);
    await serial.write(frame);
  }

  Future<void> queryStatus() async {
    await sendCommand(Commands.queryStatus, []);
  }

  Future<void> shippingControl(int slot, bool enableDropDetect) async {
    final params = [
      slot - 1,
      0x01,
      enableDropDetect ? 0x01 : 0x00,
      0x00,
    ];
    await sendCommand(Commands.shippingControl, params);
  }

  Future<void> queryDropDetectionStatus() async {
    await sendCommand(Commands.dropDetectionStatus, []);
  }

  Future<void> dropItem({
    required int slot,
    bool enableDropDetect = true,
    bool enableLiftSystem = false,
  }) async {
    final params = [
      slot - 1,
      0x01,
      enableDropDetect ? 0x01 : 0x00,
      enableLiftSystem ? 0x01 : 0x00,
    ];
    await sendCommand(Commands.shippingControl, params);
  }
}
