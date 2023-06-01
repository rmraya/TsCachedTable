/*******************************************************************************
 * Copyright (c) 2023 Maxprograms.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 1.0 which accompanies this distribution,
 * and is available at https://www.eclipse.org/org/documents/epl-v10.html
 *
 * Contributors: Maxprograms - initial API and implementation
 *******************************************************************************/
import { ColumnModel } from "./ColumnModel";

export interface TableModel {
    getRowCount(): number;
    getColumnCount(): number;
    getColums(): ColumnModel[];
    getCell(rowIndex: number, columnIndex: number): HTMLTableCellElement;
}