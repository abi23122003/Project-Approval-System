from rest_framework.throttling import AnonRateThrottle


class AccountThrottle(AnonRateThrottle):
    scope = 'account'
    rate = '10/min'

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class LoginThrottle(AccountThrottle):
    scope = 'account_login'
    rate = '30/min'


class RegistrationThrottle(AccountThrottle):
    scope = 'account_registration'


class PasswordResetThrottle(AccountThrottle):
    scope = 'account_reset'
    rate = '5/min'
