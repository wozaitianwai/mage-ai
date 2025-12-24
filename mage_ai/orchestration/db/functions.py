import re
from typing import List, Optional

from sqlalchemy.sql import func

from mage_ai.orchestration.db import db_connection_url
from mage_ai.orchestration.db.constants import DatabaseType


def database_type() -> DatabaseType:
    if db_connection_url.startswith('postgresql'):
        return DatabaseType.POSTGRESQL
    elif db_connection_url.startswith('sqlite'):
        return DatabaseType.SQLITE


TIMEZONE_OFFSET_RE = re.compile(r'^([+-])(\d{2}):?(\d{2})$')


def parse_timezone_offset_minutes(timezone_offset: str) -> Optional[int]:
    if not timezone_offset:
        return None

    match = TIMEZONE_OFFSET_RE.match(timezone_offset)
    if not match:
        return None

    sign, hours, minutes = match.groups()
    total_minutes = int(hours) * 60 + int(minutes)

    return -total_minutes if sign == '-' else total_minutes


def format_timezone_offset(minutes: int) -> str:
    sign = '-' if minutes < 0 else '+'
    total_minutes = abs(minutes)
    hours = total_minutes // 60
    minutes_remainder = total_minutes % 60

    return f'{sign}{hours:02d}:{minutes_remainder:02d}'


def format_datetime(column, datetime_formats: List[str], timezone_offset: str = None):
    datetime_format = []
    for value in datetime_formats:
        if 'year' == value:
            if DatabaseType.POSTGRESQL == database_type():
                datetime_format.append('YYYY')
            else:
                datetime_format.append('%Y')
        elif 'month' == value:
            if DatabaseType.POSTGRESQL == database_type():
                datetime_format.append('MM')
            else:
                datetime_format.append('%m')
        elif 'day' == value:
            if DatabaseType.POSTGRESQL == database_type():
                datetime_format.append('DD')
            else:
                datetime_format.append('%d')

    datetime_format = '-'.join(datetime_format)
    offset_minutes = parse_timezone_offset_minutes(timezone_offset)

    if DatabaseType.POSTGRESQL == database_type():
        if offset_minutes is not None:
            offset_string = format_timezone_offset(offset_minutes)

            return func.to_char(func.timezone(offset_string, column), datetime_format)

        return func.to_char(column, datetime_format)

    if offset_minutes is not None:
        modifier = f'{offset_minutes} minutes'
        if offset_minutes > 0:
            modifier = f'+{offset_minutes} minutes'

        return func.strftime(datetime_format, func.datetime(column, modifier))

    return func.strftime(datetime_format, column)
