import 'package:intl/intl.dart';

class Format {
  static priceFormat(double price) {
    String priceFormat = NumberFormat('#,###,###,###,###.##').format(price);
    return priceFormat;
  }
}
