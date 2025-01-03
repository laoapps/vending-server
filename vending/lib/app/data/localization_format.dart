import 'package:get/get.dart';

class LocalizationFormat {
  static const String la_LA = "la_LA";
  static const String en_US = "en_US";
  String local = Get.locale.toString();

  var listLang = [
    {'la_LA': 'ລາວ'},
    {'en_US': 'English'}
  ];

  getLang() {
    String nowLang;
    if (local == la_LA) {
      nowLang = "ລາວ";
    } else if (local == en_US) {
      nowLang = "English";
    } else {
      nowLang = "NO";
    }
    return nowLang;
  }
}
