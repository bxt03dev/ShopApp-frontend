import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../model/product';
import { ProductService, UpdateProductDTO } from '../../../service/product.service';
import { environment } from '../../../common/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-product-detail',
  templateUrl: './product-detail.admin.component.html',
  styleUrls: ['./product-detail.admin.component.scss']
})
export class ProductDetailAdminComponent implements OnInit {
  product: Product | null = null;
  loading = false;
  productId: number = 0;
  imageUrl: string = '';
  isEditing: boolean = false;
  productForm!: FormGroup;
  submitting: boolean = false;
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  uploadingImage: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.productId = +id;
        this.loadProductDetails(this.productId);
      } else {
        this.router.navigate(['/admin/products']);
      }
    });
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: [0, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      categoryId: ['', Validators.required]
    });
  }

  loadProductDetails(id: number): void {
    this.loading = true;
    this.productService.getDetailProduct(id).subscribe({
      next: (response) => {
        this.product = response.result;
        console.log('Loaded product details:', this.product);
        if (this.product && this.product.thumbnail) {
          // Thêm timestamp để tránh cache
          this.imageUrl = `${environment.apiBaseUrl}/products/images/${this.product.thumbnail}?t=${new Date().getTime()}`;
          this.imagePreviewUrl = this.imageUrl;
          console.log('Set image URL to:', this.imageUrl);
        }
        this.updateFormValues();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product details:', error);
        this.loading = false;
        this.router.navigate(['/admin/products']);
      }
    });
  }

  updateFormValues(): void {
    if (this.product) {
      this.productForm.patchValue({
        name: this.product.name,
        price: this.product.price,
        description: this.product.description,
        categoryId: this.product.categoryId
      });
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.updateFormValues();
      this.imagePreviewUrl = this.imageUrl;
      this.selectedFile = null;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      console.log('Selected file:', this.selectedFile.name, 'Type:', this.selectedFile.type, 'Size:', this.selectedFile.size);
      
      // Validate file type
      const fileType = this.selectedFile.type;
      if (fileType !== 'image/jpeg' && fileType !== 'image/png' && fileType !== 'image/jpg') {
        console.error('Invalid file type:', fileType);
        Swal.fire({
          title: 'Lỗi!',
          text: 'Chỉ chấp nhận file hình ảnh có định dạng JPEG, JPG hoặc PNG',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        this.selectedFile = null;
        return;
      }
      
      // Validate file size (max 10MB - matching backend limit)
      if (this.selectedFile.size > 10 * 1024 * 1024) {
        console.error('File too large:', this.selectedFile.size);
        Swal.fire({
          title: 'Lỗi!',
          text: 'Kích thước file tối đa là 10MB',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        this.selectedFile = null;
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  uploadImage(): void {
    if (!this.selectedFile || !this.productId) {
      console.error('No file selected or product ID missing');
      return;
    }

    console.log('Starting image upload for product ID:', this.productId);
    this.uploadingImage = true;
    
    this.productService.uploadProductImage(this.productId, this.selectedFile).subscribe({
      next: (response) => {
        console.log('Upload response:', response);
        
        // Xử lý khi API trả về danh sách ảnh sản phẩm
        if (response && response.length > 0) {
          console.log('Product images received:', response);
          
          // Lấy ảnh đầu tiên từ danh sách
          const productImage = response[0];
          console.log('Using first image:', productImage);
          
          // Cập nhật thumbnail cho sản phẩm trong backend
          if (productImage && productImage.imageUrl) {
            this.updateProductThumbnail(productImage.imageUrl);
          } else {
            this.uploadingImage = false;
            console.warn('No imageUrl found in the response');
          }
        } else {
          console.warn('No images returned from server');
          this.uploadingImage = false;
          
          Swal.fire({
            title: 'Cảnh báo',
            text: 'Không nhận được thông tin ảnh từ server',
            icon: 'warning',
            confirmButtonText: 'OK'
          });
        }
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.uploadingImage = false;
        
        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể tải lên hình ảnh. Vui lòng thử lại sau.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  // Phương thức mới để cập nhật thumbnail cho sản phẩm
  updateProductThumbnail(imageUrl: string): void {
    if (!this.product || !this.productId) {
      console.error('Product not loaded or product ID missing');
      this.uploadingImage = false;
      return;
    }
    
    console.log('Updating product thumbnail to:', imageUrl);
    
    // Tạo đối tượng cập nhật với các giá trị hiện tại từ form
    const updatedProduct: UpdateProductDTO = {
      name: this.productForm.value.name,
      price: this.productForm.value.price,
      description: this.productForm.value.description,
      categoryId: this.productForm.value.categoryId,
      thumbnail: imageUrl // Thêm trường thumbnail vào đối tượng cập nhật
    };
    
    // Gọi API cập nhật sản phẩm
    this.productService.updateProduct(this.productId, updatedProduct).subscribe({
      next: (response) => {
        console.log('Product updated with new thumbnail:', response);
        
        // Cập nhật thông tin sản phẩm từ response
        this.product = response.result;
        
        // Cập nhật URL hình ảnh với timestamp để tránh cache
        if (this.product && this.product.thumbnail) {
          this.imageUrl = `${environment.apiBaseUrl}/products/images/${this.product.thumbnail}?t=${new Date().getTime()}`;
          this.imagePreviewUrl = this.imageUrl;
          console.log('Updated image URL to:', this.imageUrl);
        }
        
        // Hoàn thành quá trình
        this.uploadingImage = false;
        this.isEditing = false;
        this.selectedFile = null;
        
        Swal.fire({
          title: 'Thành công!',
          text: 'Cập nhật hình ảnh thành công',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      },
      error: (error) => {
        console.error('Error updating product thumbnail:', error);
        this.uploadingImage = false;
        
        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể cập nhật thumbnail sản phẩm. Vui lòng thử lại sau.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  reloadProductDetails(): void {
    this.productService.getDetailProduct(this.productId).subscribe({
      next: (response) => {
        this.product = response.result;
        if (this.product && this.product.thumbnail) {
          // Thêm timestamp để tránh cache
          this.imageUrl = `${environment.apiBaseUrl}/products/images/${this.product.thumbnail}?t=${new Date().getTime()}`;
          this.imagePreviewUrl = this.imageUrl;
        }
        this.updateFormValues();
        this.uploadingImage = false;
      },
      error: (error) => {
        console.error('Error reloading product details:', error);
        this.uploadingImage = false;
      }
    });
  }

  removeSelectedImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = this.imageUrl;
  }

  saveChanges(): void {
    if (this.productForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
      return;
    }

    const updatedProduct: UpdateProductDTO = {
      name: this.productForm.value.name,
      price: this.productForm.value.price,
      description: this.productForm.value.description,
      categoryId: this.productForm.value.categoryId
    };

    // Nếu sản phẩm đã có thumbnail, giữ lại
    if (this.product && this.product.thumbnail) {
      updatedProduct.thumbnail = this.product.thumbnail;
    }

    this.submitting = true;
    this.productService.updateProduct(this.productId, updatedProduct).subscribe({
      next: (response) => {
        this.product = response.result;
        this.submitting = false;
        
        // If there's a selected file, upload it after saving product details
        if (this.selectedFile) {
          this.uploadImage();
        } else {
          this.isEditing = false;
          Swal.fire({
            title: 'Thành công!',
            text: 'Cập nhật sản phẩm thành công',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        }
      },
      error: (error) => {
        console.error('Error updating product:', error);
        this.submitting = false;
        
        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể cập nhật sản phẩm. Vui lòng thử lại sau.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.updateFormValues();
    this.selectedFile = null;
    this.imagePreviewUrl = this.imageUrl;
  }

  deleteProduct(): void {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Bạn không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed && this.productId) {
        this.productService.deleteProduct(this.productId).subscribe({
          next: (response) => {
            Swal.fire(
              'Đã xóa!',
              'Sản phẩm đã được xóa thành công.',
              'success'
            );
            this.router.navigate(['/admin/products']);
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            Swal.fire(
              'Lỗi!',
              'Không thể xóa sản phẩm. Vui lòng thử lại sau.',
              'error'
            );
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/products']);
  }
}
