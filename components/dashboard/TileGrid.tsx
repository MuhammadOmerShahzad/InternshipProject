'use client';

import Tile from './Tile';

interface TileData {
    name: string;
    image: string;
}

interface TileGridProps {
    tiles: TileData[];
    onTileClick?: (tileName: string) => void;
}

export default function TileGrid({ tiles, onTileClick }: TileGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {tiles.map((tile) => (
                <Tile
                    key={tile.name}
                    name={tile.name}
                    image={tile.image}
                    onClick={onTileClick}
                />
            ))}
        </div>
    );
}

