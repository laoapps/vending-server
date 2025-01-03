import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../app/config/config.dart';
import '../dialog/showdialog.dart';
import '../textfield/perfix_textfield.dart';

class ButtomSheet {
  static showButtonSheetEditTextField(
      BuildContext context,
      TextEditingController controller,
      String hintText,
      IconData icon,
      TextInputType keyboardType,
      Function onTap) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(8),
          child: Column(
            children: [
              PrefixTextField(
                obscureText: false,
                prefixIcon: icon,
                hintText: "${hintText}",
                controller: controller,
                keyboardType: keyboardType,
                validator: (p0) {
                  if (p0!.isEmpty) {
                    return "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ";
                  }
                  return null;
                },
              ),
              const SizedBox(
                height: 10,
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      child: const Text("ຍົກເລີກ")),
                  TextButton(
                      onPressed: () {
                        if (controller.text.length != 0) {
                          showDialog(
                            context: context,
                            builder: (context) {
                              return AlertDialog(
                                title:
                                    const Text("ແນ່ໃຈບໍທີ່ຕ້ອງການແກ້ໄຂຂໍ້ມູນ"),
                                actions: [
                                  TextButton(
                                      onPressed: () {
                                        Navigator.pop(context);
                                      },
                                      child: const Text("ຍົກເລີກ")),
                                  TextButton(
                                      onPressed: () {
                                        Get.back();
                                        Get.back();
                                        onTap();
                                      },
                                      child: const Text(
                                        "ແກ້ໄຂຂໍ້ມູນ",
                                        style: TextStyle(color: Colors.red),
                                      )),
                                ],
                              );
                            },
                          );
                        }
                      },
                      child: const Text(
                        "ແກ້ໄຂຂໍ້ມູນ",
                        style: TextStyle(color: Colors.red),
                      ))
                ],
              )
            ],
          ),
        );
      },
    );
  }

  dialogEditTime(
      BuildContext context, String title, int time, Function onClick) {
    showDialog(
      context: context,
      builder: (context) {
        int oldTime = time;
        int hour = time ~/ 60;
        int minute = time % 60;
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Column(
                children: [
                  Text(
                    "${title}",
                    style: TextStyle(fontFamily: font),
                  ),
                  ElevatedButton(
                      onPressed: () async {
                        // TimeOfDay timeData = await DateTimePic.pickTime(
                        //     context,
                        //     DateTime.now().copyWith(
                        //         hour: hour, minute: minute)) as TimeOfDay;

                        // setState(() {
                        //   hour = timeData.hour;
                        //   minute = timeData.minute;
                        //   time = hour * 60 + minute;
                        // });
                      },
                      child: Text("${hour}:${minute}"))
                ],
              ),
              actions: [
                TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    child: const Text(
                      "ຍົກເລີກ",
                      style: TextStyle(fontFamily: font),
                    )),
                TextButton(
                    onPressed: () {
                      if (oldTime != time) {
                        Navigator.pop(context);
                        ShowDialog.loading();
                        onClick(time);
                      } else {
                        ShowDialog.showDialogbox(
                            "ເວລາທີ່ເລືອກຕ້ອງບໍ່ຕົງກັບເວລາເກົ່າ");
                      }
                    },
                    child: const Text(
                      "ແກ້ໄຂ",
                      style: TextStyle(color: Colors.red, fontFamily: font),
                    ))
              ],
            );
          },
        );
      },
    );
  }

  showButtonSheetAddTextField(
      bool isPhone,
      BuildContext context,
      TextEditingController controller,
      String hintText,
      IconData icon,
      TextInputType keyboardType,
      Function onTap) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(8),
          child: Column(
            children: [
              PrefixTextField(
                obscureText: false,
                prefixIcon: icon,
                hintText: "${hintText}",
                controller: controller,
                keyboardType: keyboardType,
                validator: (p0) {
                  if (isPhone ? p0!.length == 8 : p0!.isEmpty) {
                    return "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ";
                  }
                  return null;
                },
              ),
              const SizedBox(
                height: 10,
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                      onPressed: () {
                        controller.clear();
                        Navigator.pop(context);
                      },
                      child: const Text("ຍົກເລີກ")),
                  TextButton(
                      onPressed: () {
                        if (isPhone
                            ? controller.text.length == 8
                            : controller.text.length != 0) {
                          Navigator.pop(context);
                          ShowDialog.loading();
                          onTap();
                        } else {
                          ShowDialog.showDialogbox(
                              "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ");
                        }
                      },
                      child: const Text(
                        "ເພີ່ມຂໍ້ມູນ",
                        style: TextStyle(color: Colors.green),
                      ))
                ],
              )
            ],
          ),
        );
      },
    );
  }

  showDialogConfirm(BuildContext context, String name, Function onClick) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(
            "ແນ່ໃຈບໍ່ທີ່ຕ້ອງການ${name}",
            style: const TextStyle(fontFamily: font),
          ),
          actions: [
            TextButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: const Text("ຍົກເລີກ")),
            TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  ShowDialog.loading();
                  onClick();
                },
                child: const Text(
                  "ຕົກລົງ",
                  style: TextStyle(color: Colors.red),
                ))
          ],
        );
      },
    );
  }

  showDialogConfirmInDialog(
      BuildContext context, String name, Function onClick) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(
            "ແນ່ໃຈບໍ່ທີ່ຕ້ອງການ${name}",
            style: const TextStyle(fontFamily: font),
          ),
          actions: [
            TextButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: const Text("ຍົກເລີກ")),
            TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                  ShowDialog.loading();
                  onClick();
                },
                child: const Text(
                  "ຕົກລົງ",
                  style: TextStyle(color: Colors.red),
                ))
          ],
        );
      },
    );
  }
}
