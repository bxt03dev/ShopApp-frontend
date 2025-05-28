import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../../service/category.service';
import { Category } from '../../../models/category';
import { Router } from '@angular/router';
import { CustomToastService } from '../../../service/custom-toast.service';

@Component({
  selector: 'app-category-admin',
  templateUrl: './category-admin.component.html',
  styleUrls: ['./category-admin.component.scss']
})
export class CategoryAdminComponent implements OnInit {
  categories: Category[] = [];
  loading: boolean = false;
  editingCategory: Category | null = null;
  newCategory: Category = {
    id: 0,
    name: ''
  };
  showAddForm: boolean = false;

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private toast: CustomToastService
  ) {
    console.log('CategoryAdminComponent initialized');
  }

  ngOnInit(): void {
    console.log('CategoryAdminComponent ngOnInit');
    this.loadCategories();
  }

  loadCategories() {
    console.log('Loading categories...');
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        console.log('Categories loaded:', data);
        this.categories = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading = false;
        this.toast.showError('Failed to load categories', 'Error');
      }
    });
  }

  startEdit(category: Category) {
    this.editingCategory = { ...category };
  }

  cancelEdit() {
    this.editingCategory = null;
  }

  updateCategory(category: Category) {
    if (!category || !category.name.trim()) {
      this.toast.showWarning('Category name cannot be empty', 'Warning');
      return;
    }

    this.categoryService.updateCategory(category.id, category).subscribe({
      next: () => {
        this.loadCategories();
        this.editingCategory = null;
        this.toast.showSuccess('Category updated successfully', 'Success');
      },
      error: (error) => {
        console.error('Error updating category:', error);
        this.toast.showError('Failed to update category', 'Error');
      }
    });
  }

  deleteCategory(id: number) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.loading = true;
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.toast.showSuccess('Category deleted successfully', 'Success');
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.toast.showError('Failed to delete category', 'Error');
          this.loading = false;
        }
      });
    }
  }

  addCategory() {
    if (!this.newCategory.name.trim()) {
      this.toast.showWarning('Category name cannot be empty', 'Warning');
      return;
    }

    this.categoryService.createCategory(this.newCategory).subscribe({
      next: () => {
        this.loadCategories();
        this.newCategory = { id: 0, name: '' };
        this.showAddForm = false;
        this.toast.showSuccess('Category added successfully', 'Success');
      },
      error: (error) => {
        console.error('Error adding category:', error);
        this.toast.showError('Failed to add category', 'Error');
      }
    });
  }
}
