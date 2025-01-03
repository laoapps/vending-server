import 'package:logger/web.dart';

class ShowLogs {
  var logger = Logger(
    filter: null, // Use the default LogFilter (-> only log in debug mode)
    printer: PrettyPrinter(), // Use the PrettyPrinter to format and print log
    output: null, // Use the default LogOutput (-> send everything to console)
  );

  normal(String logs) {
    print(logs.toString());
  }

  i(String logs) {
    logger.i(logs, time: DateTime.now());
  }

  w(String logs) {
    logger.w(logs, time: DateTime.now());
  }

  f(String? error, StackTrace? stackTrace) {
    logger.f('', time: DateTime.now(), error: error, stackTrace: stackTrace);
  }
}
