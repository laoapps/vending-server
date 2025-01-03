import 'dart:convert';

import 'package:get/utils.dart';
import 'package:http/http.dart' as http;

import '../../widget/dialog/showdialog.dart';

class Emessage {
  static const String success = 'success';
  static const String succeeded = 'succeeded';
  static const String error = 'error';
  static const String insertSucceeded = 'inserting succeeded';
  static const String insertError = 'inserting error';
  static const String updateSucceeded = 'updating succeeded';
  static const String updateError = 'updating error';
  static const String deletingSucceeded = 'deleting succeeded';
  static const String deletingerror = 'deleting error';
  static const String notfound = 'not found';
  static const String exist = 'exist';
  static const String bodyIsEmpty = "body is empty";
  static const String idIsEmpty = "id is empty";
  static const String unknownError = "unknown Error";
  static const String selectOneSucceeded = "select One Succeeded";
  static const String selectOneError = "select One Error";
  static const String selectManySucceeded = "select Many Succeeded";
  static const String selectManyError = "select Many Error";
  static const String generateSucceeded = "find Succeeded";
  static const String findError = "find Error";
  static const String resetdatasucceeded = "resetdatasucceeded";
  static const String commandNotFound = "commandNotFound";
  static const String tokenNotFound = "tokenNotFound";
  static const String notAllowed = "notAllowed";
  static const String confirmTransactionFailed = "ConfirmTransactionFailed";
  static const String createdTransactionFailed = "CreatedTransactionFailed";
  static const String invalidPermission = "invalidPermission";
  static const String lockError = "lockError";
  static const String createdPasscodeFailed = "CreatedPasscodeFailed";
  static const String editSuccessed = "editSuccessed";
  static const String changedPasscodeSuccessed = "ChangedPasscodeSuccessed";
  static const String changedPasscodeFailed = "ChangedPasscodeFailed";

  static checkMessageDialog(http.Response response) {
    var message = Get.locale!.languageCode == 'la'
        ? _compareLAMessage(jsonDecode(response.body)['message'])
        : _compareUSMessage(jsonDecode(response.body)['message']);
    ShowDialog.showDialogbox(message);
  }

  static checkMessage(http.Response response) {
    var message = Get.locale!.languageCode == 'la'
        ? _compareLAMessage(jsonDecode(response.body)['message'])
        : _compareUSMessage(jsonDecode(response.body)['message']);
    return message;
  }

  static _compareLAMessage(String status) {
    switch (status) {
      case success:
        return "ສໍາເລັດແລ້ວ";
      case succeeded:
        return "ສໍາເລັດແລ້ວ";
      case error:
        return "ມີຂໍ້ຜິດພາດ";
      case insertSucceeded:
        return "ສໍາເລັດແລ້ວ";
      case insertError:
        return "ມີຂໍ້ຜິດພາດ";
      case updateSucceeded:
        return "ສໍາເລັດແລ້ວ";
      case updateError:
        return "ມີຂໍ້ຜິດພາດ";
      case deletingSucceeded:
        return "ສໍາເລັດແລ້ວ";
      case deletingerror:
        return "ມີຂໍ້ຜິດພາດ";
      case notfound:
        return "ບໍ່ພົບຂໍ້ມູນ";
      case exist:
        return "ເຄີຍເຮັດສິ່ງນີ້ໄປແລ້ວ";
      case bodyIsEmpty:
        return "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ";
      case idIsEmpty:
        return "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ";
      case unknownError:
        return "ມີຂໍ້ຜິດພາດ";
      case selectOneSucceeded:
        return "ສໍາເລັດແລ້ວ";
      case selectOneError:
        return "ມີຂໍ້ຜິດພາດ";
      case selectManySucceeded:
        return "ສໍາເລັດແລ້ວ";
      case selectManyError:
        return "ມີຂໍ້ຜິດພາດ";
      case generateSucceeded:
        return "ສໍາເລັດແລ້ວ";
      case findError:
        return "ມີຂໍ້ຜິດພາດ";
      case resetdatasucceeded:
        return "ສໍາເລັດແລ້ວ";
      case commandNotFound:
        return "ມີຂໍ້ຜິດພາດ";
      case tokenNotFound:
        return "ມີຂໍ້ຜິດພາດ";
      case notAllowed:
        return "ບໍ່ມີສິດໃນການໃຊ້ງານ";
      case confirmTransactionFailed:
        return "ມີຂໍ້ຜິດພາດ";
      default:
        return "ມີຂໍ້ຜິດພາດ";
    }
  }

  static _compareUSMessage(String status) {
    switch (status) {
      case success:
        return "Success";
      case succeeded:
        return "Succeeded";
      case error:
        return "Error";
      case insertSucceeded:
        return "Insert Succeeded";
      case insertError:
        return "Insert Error";
      case updateSucceeded:
        return "Update Succeeded";
      case updateError:
        return "Update Error";
      case deletingSucceeded:
        return "Deleting Succeeded";
      case deletingerror:
        return "Deleting Error";
      case notfound:
        return "Not Found";
      case exist:
        return "Exist";
      case bodyIsEmpty:
        return "Body Is Empty";
      case idIsEmpty:
        return "Id Is Empty";
      case unknownError:
        return "Unknown Error";
      case selectOneSucceeded:
        return "Select One Succeeded";
      case selectOneError:
        return "Select One Error";
      case selectManySucceeded:
        return "Select Many Succeeded";
      case selectManyError:
        return "Select Many Error";
      case generateSucceeded:
        return "Generate Succeeded";
      case findError:
        return "Find Error";
      case resetdatasucceeded:
        return "Resetdata Succeeded";
      case commandNotFound:
        return "Command Not Found";
      case tokenNotFound:
        return "Token Not Found";
      case notAllowed:
        return "Not Allowed";
      case confirmTransactionFailed:
        return "Confirm Transaction Failed";
      default:
        return "Unknown Error";
    }
  }
}
