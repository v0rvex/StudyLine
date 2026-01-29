import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'dart:async';
import 'api.dart';

class AppState extends ChangeNotifier {
  String? _token;
  int? teacherId;
  int? pinnedGroupId;
  ThemeMode themeMode = ThemeMode.system;

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  // <<< FIX #1 — ready flag >>>
  final Completer<void> _ready = Completer<void>();
  Future<void> get ready => _ready.future;

  AppState() {
    _load();
  }

  bool get isLogged => _token != null;
  bool get hasPinnedGroup => pinnedGroupId != null;

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();

    _token = prefs.getString('token');
    teacherId = prefs.getInt('teacherId');
    pinnedGroupId = prefs.getInt('pinnedGroupId');

    final stored = prefs.getString('themeMode');
    if (stored == 'light') themeMode = ThemeMode.light;
    if (stored == 'dark') themeMode = ThemeMode.dark;

    if (_token != null) Api.setToken(_token);

    // <<< FIX #3 — subscribe pinned group after restart >>>
    if (pinnedGroupId != null && teacherId == null) {
      await subscribeGroup(pinnedGroupId!);
    }

    // <<< finalize ready >>>
    if (!_ready.isCompleted) _ready.complete();

    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode m) async {
    themeMode = m;
    final prefs = await SharedPreferences.getInstance();

    if (m == ThemeMode.system) {
      await prefs.remove('themeMode');
    } else {
      await prefs.setString('themeMode', m == ThemeMode.light ? 'light' : 'dark');
    }

    notifyListeners();
  }

  Future<void> loginTeacher(String login, String password) async {
    final res = await Api.login(login, password);

    final token = res['token'] as String?;
    final id = res['id'] != null ? (res['id'] as num).toInt() : null;

    if (token != null) {
      _token = token;
      teacherId = id;

      Api.setToken(_token);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', token);

      if (id != null) {
        await prefs.setInt('teacherId', id);
        await _messaging.subscribeToTopic('teacher$id');
      }

      // teacher cannot have pinned group
      await savePinnedGroup(null);

      notifyListeners();
    } else {
      throw Exception('login failed');
    }
  }

  Future<void> logoutTeacher() async {
    if (_token != null) {
      try { await Api.logout(_token!); } catch (_) {}
    }

    if (teacherId != null) {
      await _messaging.unsubscribeFromTopic('teacher$teacherId');
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('teacherId');

    _token = null;
    teacherId = null;
    Api.setToken(null);

    notifyListeners();
  }

  Future<void> savePinnedGroup(int? id) async {
    final prefs = await SharedPreferences.getInstance();

    // <<< FIX #2 — properly subscribe/unsubscribe >>>
    if (pinnedGroupId != null) {
      await unsubscribeGroup(pinnedGroupId!);
    }

    if (id == null) {
      await prefs.remove('pinnedGroupId');
    } else {
      await prefs.setInt('pinnedGroupId', id);
      await subscribeGroup(id);
    }

    pinnedGroupId = id;
    notifyListeners();
  }

  Future<void> subscribeGroup(int id) async {
    try {
      await _messaging.subscribeToTopic('group$id');
    } catch (_) {}
  }

  Future<void> unsubscribeGroup(int id) async {
    try {
      await _messaging.unsubscribeFromTopic('group$id');
    } catch (_) {}
  }

  // Cache notification flags
  Future<bool> hasShownCacheNotice(int groupId) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('shown_cache_$groupId') ?? false;
  }

  Future<void> setShownCacheNotice(int groupId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('shown_cache_$groupId', true);
  }
}
