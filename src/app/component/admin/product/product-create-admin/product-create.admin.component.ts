import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService, ProductDTO } from '../../../../service/product.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-product-create',
  templateUrl: './product-create.admin.component.html',
  styleUrls: ['./product-create.admin.component.scss']
})
export class ProductCreateAdminComponent implements OnInit {
  productForm!: FormGroup;
  submitting: boolean = false;
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;

  constructor(
    private router: Router,
    private productService: ProductService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: [0, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      categoryId: ['', Validators.required]
    });
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

  removeSelectedImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
  }

  createProduct(): void {
    if (this.productForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
      return;
    }

    const newProduct: ProductDTO = {
      name: this.productForm.value.name,
      price: this.productForm.value.price,
      description: this.productForm.value.description,
      categoryId: this.productForm.value.categoryId
    };

    this.submitting = true;
    this.productService.createProduct(newProduct).subscribe({
      next: (response) => {
        console.log('Product created successfully:', response);

        if (this.selectedFile && response.result && response.result.id) {
          // Nếu có ảnh được chọn, upload ảnh sau khi tạo sản phẩm thành công
          this.uploadProductImage(response.result.id);
        } else {
          this.submitting = false;
          this.showSuccessAndRedirect();
        }
      },
      error: (error) => {
        console.error('Error creating product:', error);
        this.submitting = false;

        Swal.fire({
          title: 'Lỗi!',
          text: 'Không thể tạo sản phẩm. Vui lòng thử lại sau.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  uploadProductImage(productId: number): void {
    if (!this.selectedFile) {
      this.submitting = false;
      this.showSuccessAndRedirect();
      return;
    }

    console.log('Starting image upload for new product ID:', productId);

    this.productService.uploadProductImage(productId, this.selectedFile).subscribe({
      next: (response) => {
        console.log('Upload response:', response);

        if (response && response.length > 0) {
          console.log('Product images received:', response);

          const productImage = response[0];
          console.log('Using first image:', productImage);

          // Cập nhật thumbnail cho sản phẩm trong backend
          if (productImage && productImage.imageUrl) {
            this.updateProductThumbnail(productId, productImage.imageUrl);
          } else {
            this.submitting = false;
            this.showSuccessAndRedirect();
          }
        } else {
          console.warn('No images returned from server');
          this.submitting = false;
          this.showSuccessAndRedirect();
        }
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.submitting = false;

        // Vẫn cho thành công vì sản phẩm đã được tạo, chỉ có ảnh bị lỗi
        this.showSuccessAndRedirect('Sản phẩm đã được tạo nhưng không thể tải lên hình ảnh');
      }
    });
  }

  updateProductThumbnail(productId: number, imageUrl: string): void {
    const updatedProduct: ProductDTO = {
      name: this.productForm.value.name,
      price: this.productForm.value.price,
      description: this.productForm.value.description,
      categoryId: this.productForm.value.categoryId,
      thumbnail: imageUrl
    };

    this.productService.updateProduct(productId, updatedProduct).subscribe({
      next: () => {
        console.log('Product updated with thumbnail');
        this.submitting = false;
        this.showSuccessAndRedirect();
      },
      error: (error) => {
        console.error('Error updating product thumbnail:', error);
        this.submitting = false;

        // Vẫn cho thành công vì sản phẩm đã được tạo, chỉ có thumbnail bị lỗi
        this.showSuccessAndRedirect('Sản phẩm đã được tạo nhưng không thể cập nhật thumbnail');
      }
    });
  }

  showSuccessAndRedirect(message: string = 'Sản phẩm đã được tạo thành công'): void {
    Swal.fire({
      title: 'Thành công!',
      text: message,
      icon: 'success',
      confirmButtonText: 'OK'
    }).then(() => {
      this.router.navigate(['/admin/products']);
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/products']);
  }
}
