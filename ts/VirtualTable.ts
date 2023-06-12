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
import { TableModel } from "./TableModel";

export class VirtualTable {

    model: TableModel;

    tableOptions: any = {
        headerBackground: 'lightgray',
        renderCache: 50,
        bufferSize: 10
    };

    tableElement: HTMLTableElement;
    headerRow: HTMLTableRowElement;
    thead: HTMLTableSectionElement;
    tbody: HTMLTableSectionElement;
    tableWidth: number;

    modelCount: number = 0;
    averageRowHeight: number = 0;

    ticking: boolean = false;

    topSpacer: HTMLTableRowElement;
    topSpacerHeight: number = 0;

    bottomSpacer: HTMLTableRowElement;
    bottomSpacerHeight: number = 0;

    cachedRows: HTMLTableRowElement[] = [];
    cachedRowsHeight: number = 0;

    startRow: number = 0;

    constructor(parent: HTMLElement, model: TableModel, options?: any) {
        parent.style.overflow = 'auto';

        this.tableElement = document.createElement('table');
        this.tableElement.style.border = 'none';
        this.tableElement.style.borderCollapse = 'collapse';
        this.tableElement.style.tableLayout = 'fixed';
        this.tableWidth = this.tableElement.clientWidth;
        parent.appendChild(this.tableElement);

        this.thead = document.createElement('thead');
        this.thead.style.border = 'none';
        this.thead.style.backgroundColor = this.tableOptions.headerBackground;
        this.tableElement.appendChild(this.thead);

        this.headerRow = document.createElement('tr');
        this.headerRow.style.border = 'none';
        this.headerRow.style.backgroundColor = 'inherit !important';
        this.headerRow.style.verticalAlign = 'middle';
        this.thead.appendChild(this.headerRow);

        this.tbody = document.createElement('tbody');
        this.tbody.classList.add('virtualTableBody');
        this.tbody.style.overflowX = 'scroll';
        this.tbody.style.overflowY = 'scroll';
        let headerHeight: number = this.thead.clientHeight + parseInt(this.thead.style.borderBottomWidth) + parseInt(this.thead.style.borderTopWidth);
        this.tbody.style.height = (parent.clientHeight - headerHeight) + 'px';
        this.tbody.style.overflowY = 'auto';
        this.tableElement.appendChild(this.tbody);

        this.setTableModel(model, options);

        parent.addEventListener('scroll', () => {
            this.handleScroll();
        });

        let config: MutationObserverInit = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    let headerHeight: number = this.thead.clientHeight + parseInt(this.thead.style.borderBottomWidth) + parseInt(this.thead.style.borderTopWidth);
                    this.tbody.style.height = (parent.clientHeight - headerHeight) + 'px';
                }
            }
        });
        observer.observe(parent, config);
    }

    setTableModel(model: TableModel, options?: any): void {
        this.model = model;
        if (options) {
            this.processOptions(options);
        }
        this.populateHeaderRow();

        this.tbody.innerHTML = '';
        this.cachedRows = [];
        this.cachedRowsHeight = 0;

        this.topSpacer = document.createElement('tr');
        this.topSpacer.style.height = '0px';
        this.topSpacer.style.width = '100%';
        this.tbody.appendChild(this.topSpacer);

        this.modelCount = this.model.getRowCount();
        for (let i: number = 0; i < this.tableOptions.renderCache && i < this.modelCount; i++) {
            let row: HTMLTableRowElement = this.createRow(i);
            this.cachedRows.push(row);
            this.tbody.appendChild(row);
            let rowHeight: number = row.clientHeight;
            let bottomBorder = parseInt(row.style.borderBottomWidth);
            if (Number.isNaN(bottomBorder)) {
                bottomBorder = 0;
            }
            let topBorder = parseInt(row.style.borderTopWidth);
            if (Number.isNaN(topBorder)) {
                topBorder = 0;
            }
            this.cachedRowsHeight += rowHeight + bottomBorder + topBorder;
        }
        this.averageRowHeight = this.cachedRowsHeight / this.cachedRows.length;

        this.bottomSpacer = document.createElement('tr');
        this.bottomSpacer.style.width = '100%';
        this.tbody.appendChild(this.bottomSpacer);

        (this.tableElement.parentElement as HTMLElement).scrollTop = 0;
        this.adjustSpacers();
        this.fullReload(0);
    }

    processOptions(options: any): void {
        if (!options.headerBackground) {
            options.headerBackground = this.tableOptions.headerBackground;
        }
        if (!options.bufferSize) {
            options.bufferSize = this.tableOptions.bufferSize;
        }
        if (!options.renderCache) {
            options.renderCache = this.tableOptions.renderCache;
        }
        this.tableOptions = options;
    }

    fullReload(fromRow: number): void {
        console.log('fullReload from ', fromRow);
        this.startRow = fromRow - this.tableOptions.renderCache / 2;
        if (this.startRow < 0) {
            this.startRow = 0;
        }
        // remove all cached rows
        let removeCount: number = this.cachedRows.length;
        for (let i: number = 0; i < removeCount; i++) {
            let row: HTMLTableRowElement = this.topSpacer.nextSibling as HTMLTableRowElement;
            this.tbody.removeChild(row);
        }
        this.cachedRows = [];
        // load new rows
        let current: HTMLTableRowElement = this.topSpacer;
        for (let i: number = 0; (i < this.tableOptions.renderCache) && (this.startRow + i < this.modelCount); i++) {
            let row: HTMLTableRowElement = this.createRow(this.startRow + i);
            this.cachedRows.push(row);
            current.after(row);
            current = row;
        }
        this.cachedRowsHeight = 0;
        for (let i: number = 0; i < this.cachedRows.length; i++) {
            let row: HTMLTableRowElement = this.cachedRows[i];
            let rowHeight: number = row.clientHeight;
            let bottomBorder = parseInt(row.style.borderBottomWidth);
            if (Number.isNaN(bottomBorder)) {
                bottomBorder = 0;
            }
            let topBorder = parseInt(row.style.borderTopWidth);
            if (Number.isNaN(topBorder)) {
                topBorder = 0;
            }
            this.cachedRowsHeight += rowHeight + bottomBorder + topBorder;
        }
        this.averageRowHeight = this.cachedRowsHeight / this.cachedRows.length;
        this.adjustSpacers();
    }

    adjustSpacers(): void {
        let totalHeight: number = this.averageRowHeight * this.modelCount;
        let lastRow: number = this.startRow + this.cachedRows.length;
        if (this.startRow === 0 && lastRow !== this.modelCount) {
            // first row is loaded but not last, topspacer is 0
            this.topSpacerHeight = 0;
            this.topSpacer.style.height = '0px';
            this.bottomSpacerHeight = totalHeight - this.cachedRowsHeight;
            this.bottomSpacer.style.height = this.bottomSpacerHeight + 'px';
        } else if (this.startRow !== 0 && lastRow === this.modelCount) {
            // last row is loaded but not first, bottomspacer is 0
            this.topSpacerHeight = totalHeight - this.cachedRowsHeight;
            this.topSpacer.style.height = this.topSpacerHeight + 'px';
            this.bottomSpacerHeight = 0;
            this.bottomSpacer.style.height = '0px';
        } else if (this.startRow === 0 && lastRow === this.modelCount) {
            // first and last rows are loaded, both spacers are 0
            this.topSpacerHeight = 0;
            this.topSpacer.style.height = '0px';
            this.bottomSpacerHeight = 0;
            this.bottomSpacer.style.height = '0px';
        } else {
            // topspacer and bottomspacer are not 0
            this.topSpacerHeight = this.startRow * this.averageRowHeight;
            this.topSpacer.style.height = this.topSpacerHeight + 'px';
            this.bottomSpacerHeight = totalHeight - this.topSpacerHeight - this.cachedRowsHeight;
            this.bottomSpacer.style.height = this.bottomSpacerHeight + 'px';
        }
    }

    loadRows(fromRow: number) {
        console.log('loading from ', fromRow);
        if (fromRow > this.startRow) {
            // add more rows at the bottom
            let count = this.cachedRows.length;
            let removeCount: number = fromRow - this.startRow;
            for (let i: number = 0; i < removeCount; i++) {
                let row: HTMLTableRowElement = this.topSpacer.nextSibling as HTMLTableRowElement;
                this.tbody.removeChild(row);
            }
            this.cachedRows.splice(0, removeCount);
            for (let i: number = 0; i < removeCount && (this.startRow + count + i < this.modelCount); i++) {
                let row: HTMLTableRowElement = this.createRow(this.startRow + count + i);
                this.cachedRows.push(row);
                this.tbody.insertBefore(row, this.bottomSpacer);
            }
            this.startRow = fromRow;
        } else if (fromRow < this.startRow) {
            // add more rows at the top
            let count = this.cachedRows.length;
            let removeCount: number = this.startRow - fromRow;
            for (let i: number = 0; i < removeCount; i++) {
                let index = count - 1 - i;
                let row: HTMLTableRowElement = this.cachedRows[index];
                this.tbody.removeChild(row);
                this.cachedRows.splice(count - 1 - i, 1);
            }
            for (let i: number = 0; i < removeCount && (this.startRow - i >= 0); i++) {
                let index = fromRow + removeCount - i - 1;
                let row: HTMLTableRowElement = this.createRow(index);
                this.cachedRows.unshift(row);
                this.topSpacer.after(row);
            }
            this.startRow = fromRow;
        }
        this.cachedRowsHeight = 0;
        for (let i: number = 0; i < this.cachedRows.length; i++) {
            let row: HTMLTableRowElement = this.cachedRows[i];
            let rowHeight: number = row.clientHeight;
            let bottomBorder = parseInt(row.style.borderBottomWidth);
            if (Number.isNaN(bottomBorder)) {
                bottomBorder = 0;
            }
            let topBorder = parseInt(row.style.borderTopWidth);
            if (Number.isNaN(topBorder)) {
                topBorder = 0;
            }
            this.cachedRowsHeight += rowHeight + bottomBorder + topBorder;
        }
        this.averageRowHeight = this.cachedRowsHeight / this.cachedRows.length;
        this.adjustSpacers();
    }

    createRow(rowIndex: number): HTMLTableRowElement {
        let row: HTMLTableRowElement = document.createElement('tr');
        row.classList.add('virtualTableRow');
        row.style.border = 'none';
        let columns: ColumnModel[] = this.model.getColums();
        let columnCount: number = columns.length;
        for (let i: number = 0; i < columnCount; i++) {
            let cell: HTMLTableCellElement = this.createCell(rowIndex, i, columns[i].fillsWidth());
            row.appendChild(cell);
        }
        return row;
    }

    createCell(rowIndex: number, i: number, fillsWidth: boolean): HTMLTableCellElement {
        let cell: HTMLTableCellElement = this.model.getCell(rowIndex, i);
        if (fillsWidth) {
            cell.style.width = '100%';
        } else {
            cell.style.width = this.model.getColums()[i].getWidth() + 'px';
        }
        cell.style.whiteSpace = 'break-spaces';
        return cell;
    }

    handleScroll(): void {
        if (!this.ticking) {
            this.ticking = true;
            window.requestAnimationFrame(() => {
                this.reviewScroll();
                this.ticking = false;
            });
        }
    }

    reviewScroll(): void {
        if (this.modelCount === 0) {
            return;
        }
        let scrollPosition: number = (this.tableElement.parentElement as HTMLElement).scrollTop;

        let approximate: number = Math.floor(scrollPosition / this.averageRowHeight);
        if (approximate < this.startRow || approximate > this.startRow + this.cachedRows.length - 1) {
            this.scrollTo(approximate);
            return;
        }

        let topSpace: number = this.topSpacerHeight;
        let firstVisible: number = -1;
        let lastVisible: number = -1;
        let length = this.cachedRows.length;
        let shown: number = 0;
        for (let i: number = 0; i < length; i++) {
            let row: HTMLTableRowElement = this.cachedRows[i];
            let rowHeight: number = row.clientHeight + parseInt(row.style.borderBottomWidth) + parseInt(row.style.borderTopWidth);
            if (row.offsetTop > scrollPosition && firstVisible === -1) {
                firstVisible = i + this.startRow;
            }
            if (firstVisible !== -1) {
                shown += rowHeight;
                lastVisible = i + this.startRow;
                if (shown > this.tbody.clientHeight) {
                    break;
                }
            }
            topSpace += rowHeight;
        }
        if (firstVisible === -1) {
            this.scrollTo(approximate);
            return;
        }
        let lastLoaded = this.startRow + length;


        if (firstVisible > this.startRow + this.tableOptions.bufferSize && firstVisible < lastLoaded - this.tableOptions.bufferSize) {
            // no need to load more rows
            return;
        }

        if (firstVisible < this.startRow + this.tableOptions.bufferSize) {
            let fromRow: number = this.startRow - this.tableOptions.bufferSize;
            if (fromRow >= 0) {
                // load more rows at the top
                this.loadRows(fromRow);
            }
            return;
        }
        if (firstVisible >= lastLoaded - this.tableOptions.bufferSize && lastLoaded !== this.modelCount) {
            // load more rows at the bottom
            this.loadRows(this.startRow + this.tableOptions.bufferSize);
        }
    }

    populateHeaderRow() {
        this.headerRow.innerHTML = '';
        let columns: ColumnModel[] = this.model.getColums();
        let columnCount: number = columns.length;
        for (let i: number = 0; i < columnCount; i++) {
            let headerCell: HTMLTableCellElement = columns[i].getHeader();
            headerCell.style.position = 'sticky';
            headerCell.style.zIndex = '5';
            headerCell.style.top = '0';
            if (columns[i].fillsWidth()) {
                headerCell.style.width = '100%';
            } else {
                headerCell.style.width = columns[i].getWidth() + 'px';
            }
            headerCell.style.textOverflow = 'ellipsis';
            headerCell.style.backgroundColor = this.tableOptions.headerBackground;
            this.headerRow.appendChild(headerCell);
        }
    }

    scrollTo(rowIndex: number, options?: any): void {
        let loaded: boolean = rowIndex >= this.startRow && rowIndex < this.startRow + this.cachedRows.length;
        if (!loaded) {
            this.fullReload(rowIndex);
        }
        let cached: number = rowIndex - this.startRow;
        let row: HTMLTableRowElement = this.cachedRows[cached];
        if (options) {
            row.scrollIntoView(options);
            return;
        }
        row.scrollIntoView({ block: 'center' });
    }
}

