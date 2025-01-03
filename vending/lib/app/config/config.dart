import 'package:get_storage/get_storage.dart';
import 'package:vending/app/data/storage_key.dart';

const String font = "NotosSansLao";
const String IMAGE =
    "https://filemanager-api.laoapps.com/api/v1/file/download/";
String endPoints =
    GetStorage().read(StorageKey.url) ?? "http://laoapps.com:9006/zdm8";
