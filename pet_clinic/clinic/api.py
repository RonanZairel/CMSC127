from django.http import JsonResponse
from .models import Vet, Specialization

def vet_specializations(request, vet_id):
    try:
        vet = Vet.objects.get(pk=vet_id)
        specializations = list(vet.specializations.values('name'))
        return JsonResponse(specializations, safe=False)
    except Vet.DoesNotExist:
        return JsonResponse([], safe=False)