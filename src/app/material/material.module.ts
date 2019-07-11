import { NgModule } from '@angular/core';

import {
  MatInputModule,
  MatCardModule,
  MatButtonModule,
  MatSidenavModule,
  MatListModule,
  MatIconModule,
  MatToolbarModule,
  MatProgressSpinnerModule,
  MatGridListModule,
  MatFormFieldModule,
  MatSelectModule,
  MatSnackBarModule,
  MatTooltipModule,
  MatTableModule,
  MatSortModule,
  MatChipsModule,
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
  MatAutocompleteModule,
  MatCheckboxModule,
  MatRadioModule,
  MatSliderModule
} from '@angular/material';

@NgModule({
  imports: [
    MatInputModule,
    MatCheckboxModule,
    MatCardModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTableModule,
    MatSortModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatRadioModule,
    MatSliderModule
  ],
  exports: [
    MatInputModule,
    MatCheckboxModule,
    MatCardModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatTableModule,
    MatSortModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatRadioModule,
    MatSliderModule
  ],
  providers: [
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 1000 } },
  ]
})
export class MaterialModule {}
