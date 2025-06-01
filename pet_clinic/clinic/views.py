from django.shortcuts import render
from django.views.generic import (ListView, 
                                  DetailView,
                                  CreateView
                                  )
from django.http import HttpResponse
from .models import Post

# Create your views here.
def home(request):
    context = { #this is out context dictionary which has the key 'post'
        'posts': Post.objects.all()
    }
    return render(request, 'clinic/home.html', context)


class PostListView(ListView):
    model = Post
    template_name = 'clinic/home.html' # <app>/<model>_<viewtype>.html
    context_object_name = 'posts'
    ordering = ['-date_posted']

class PostDetailView(DetailView):
    model = Post

class PostCreateView(CreateView):
    model = Post
    fields = ['title', 'content']

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)
    
    

    
def about(request):
    return render(request,'clinic/about.html', {'title': 'About'})
