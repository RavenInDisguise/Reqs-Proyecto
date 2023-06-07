--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-21
-- Descripción: Procedimiento que retorna la lista de reservas
--              de un cubículo
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ObtenerReservasDeCubiculo]
    @IN_idCubiculo          INT
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);

    BEGIN TRY

        -- VALIDACIONES
        -- ¿Existe el cubículo?

        IF NOT EXISTS(
            SELECT  1
            FROM    [dbo].[Cubiculos] C
            WHERE   C.[id] = @IN_idCubiculo
        )
        BEGIN
            RAISERROR('No existe ningún cubículo con el ID %d', 16, 1, @IN_idCubiculo);
        END;

        SELECT  R.[id],
                C.[nombre] AS 'nombreCubiculo', 
                C.[id] AS 'idCubiculo',
				C.[capacidad] AS 'capacidad',
                R.[fecha] AS 'fecha',
                R.[horaInicio] AS 'horaInicio',
                R.[horaFin] AS 'horaFin',
                R.[activo] AS 'activo',
                R.[confirmado] AS 'confirmado',
                CONCAT(E.[nombre], ' ', E.[apellido1], ' ', E.[apellido2]) AS 'nombreEstudiante',
                E.[id] AS 'idEstudiante'
        FROM [dbo].[Reservas] R 
        INNER JOIN [dbo].[Cubiculos] C
            ON  R.[idCubiculo] = C.[id]
		INNER JOIN [dbo].[Estudiantes] E ON E.[id] = R.[idEstudiante]
        WHERE   C.[id] = @IN_idCubiculo
            AND R.[eliminada] = 0
        ORDER BY Activo DESC, Confirmado ASC;

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @ErrorNumber != 50000
        BEGIN
            -- Si no es un error personalizado, se registra el error
            INSERT INTO [dbo].[Errors]
            VALUES (
                SUSER_NAME(),
                ERROR_NUMBER(),
                ERROR_STATE(),
                ERROR_SEVERITY(),
                ERROR_LINE(),
                ERROR_PROCEDURE(),
                ERROR_MESSAGE(),
                GETUTCDATE()
            );
        END;

        RAISERROR('%s - Error Number: %i', 
            @ErrorSeverity, @ErrorState, @Message, @ErrorNumber);

    END CATCH;
END;