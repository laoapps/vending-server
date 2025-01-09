import 'package:flutter/material.dart';

import 'package:get/get.dart';
import 'package:vending/app/color/main_color.dart';
import 'package:vending/app/config/config.dart';

import '../controllers/test_machine_controller.dart';

class TestMachineView extends GetView<TestMachineController> {
  const TestMachineView({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: ColorData.mainColor,
        iconTheme: IconThemeData(color: ColorData.txtColor),
        title: Text(
          'ທົດສອບ',
          style: TextStyle(fontFamily: font, color: ColorData.txtColor),
        ),
        centerTitle: true,
      ),
      body: const Center(
        child: Text(
          'TestMachineView is working',
          style: TextStyle(fontSize: 20),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          controller.testMachine();
        },
        child: Text(
          "TEST",
          style: TextStyle(fontFamily: font),
        ),
      ),
    );
  }
}
