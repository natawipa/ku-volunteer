from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class NoPrevNextPagination(PageNumberPagination):
    """PageNumberPagination that returns only count and results."""
    page_size = 20

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'results': data,
        })
