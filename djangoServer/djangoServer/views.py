import time
import pandas as pd

from django.shortcuts import render, redirect, HttpResponse
from django.urls import get_resolver

# --------------------------------------------------------------------------------
# Favicon
faviconUrl = 'http://oa.ia.ac.cn/favicon.ico'


# --------------------------------------------------------------------------------
# Handlers

def favicon(request):
    return redirect(faviconUrl)


def index(request):
    context = dict(
        ctime=time.ctime(),
        urls=['{}'.format(e.pattern)
              for e in get_resolver().url_patterns]
    )
    return render(request, 'index.html', context)


def animation(request):
    context = dict(
        ctime=time.ctime(),
    )
    return render(request, 'animation.html', context)


def fullik(request):
    return render(request, 'fullik.html', {})
