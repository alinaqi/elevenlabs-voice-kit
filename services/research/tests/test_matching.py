from research_service.matching import match_fact, tokens
from research_service.models import Fact

FACTS = [
    Fact(question='What are the Dtec office hours?', answer='07:30 to 15:00.', sources=[], confidence='high'),
    Fact(question='Which bus routes serve DSO?', answer='50, 320.', sources=[], confidence='high'),
]


def test_tokens_drop_stopwords_and_short_and_stem():
    assert tokens('buses DSO routes hours bus') == {'bus', 'route', 'hour'}
    assert 'what' not in tokens('What is the hours')
    assert 'a' not in tokens('a b hours')


def test_tokens_keep_arabic_letters():
    assert tokens('مسجد الواحة') == {'مسجد', 'الواحة'}


def test_match_hits_paraphrase():
    hit = match_fact('dtec office hours please', FACTS)
    assert hit is not None and hit.answer.startswith('07:30')


def test_match_misses_unrelated():
    assert match_fact('how do I bake bread', FACTS) is None


def test_match_empty_question_or_facts():
    assert match_fact('the a', FACTS) is None
    assert match_fact('dtec hours', []) is None


def test_match_plural_stem():
    assert match_fact('bus route serve DSO', FACTS) is not None


def test_place_names_alone_do_not_make_a_match():
    from research_service.matching import match_fact
    from research_service.models import Fact

    q = 'How many campuses does Dtec have in Dubai Silicon Oasis?'
    facts = [Fact(question=q, answer='Two.', sources=[], confidence='high')]
    assert match_fact('Which metro station is closest to Dubai Silicon Oasis?', facts) is None
