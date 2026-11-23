from research_service.ratelimit import RateLimiter


def test_allows_up_to_limit_then_blocks():
    rl = RateLimiter(limit=2, window=60, clock=lambda: 0.0)
    assert rl.allow('ip') and rl.allow('ip')
    assert not rl.allow('ip')


def test_keys_are_independent():
    rl = RateLimiter(limit=1, window=60, clock=lambda: 0.0)
    assert rl.allow('a') and rl.allow('b')


def test_window_expires():
    now = [0.0]
    rl = RateLimiter(limit=1, window=60, clock=lambda: now[0])
    assert rl.allow('ip') and not rl.allow('ip')
    now[0] = 61
    assert rl.allow('ip')
